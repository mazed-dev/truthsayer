import {
  findLongestCommonContinuousPiece,
  tfUse,
  loadWinkModel,
} from 'text-information-retrieval'
import type { LongestCommonContinuousPiece } from 'text-information-retrieval'
import type {
  NodeEventType,
  NodeEventPatch,
  NodeEventListener,
  Nid,
  TNode,
  StorageApi,
} from 'smuggler-api'
import { NodeUtil } from 'smuggler-api'
import { TDoc } from 'elementary'
import { log } from 'armoury'

let tfState: tfUse.TfState | undefined = undefined

const wink_ = loadWinkModel()

const kScoreThreshold = 0.42

export type RelevantNode = {
  node: TNode
  score: number
  matchedPiece?: LongestCommonContinuousPiece
}
export async function findRelevantNodes(
  phrase: string,
  storage: StorageApi,
  excludedNids?: Set<Nid>
): Promise<RelevantNode[]> {
  if (tfState == null) {
    log.error('Similarity search state is not initialised')
    return []
  }
  const phraseDoc = wink_.readDoc(phrase)
  const phraseEmbedding = await tfState.encoder.embed(
    phraseDoc.out(wink_.its.normal)
  )
  const allNids = await storage.node.getAllNids({})
  let relevantNids: { score: number; nid: Nid }[] = []
  for (const nid of allNids) {
    if (!!excludedNids?.has(nid)) {
      continue
    }
    const nodeSimSearchInfo = await storage.node.getNodeSimilaritySearchInfo({
      nid,
    })
    if (
      nodeSimSearchInfo == null ||
      !tfUse.isPerDocIndexUpToDate(
        nodeSimSearchInfo?.algorithm,
        nodeSimSearchInfo?.version
      )
    ) {
      // Skip nodes with invalid index
      log.warning(
        `Similarity index for node ${nid} is invalid "${nodeSimSearchInfo?.algorithm}:${nodeSimSearchInfo?.version}"`
      )
      continue
    }
    const nodeEmbedding = tfUse.tensor2dFromJson(
      nodeSimSearchInfo.embeddingJson
    )
    // const score = tfUse.euclideanDistance(phraseEmbedding, nodeEmbedding)
    const score = tfUse.cosineDistance(phraseEmbedding, nodeEmbedding)
    if (score < kScoreThreshold) {
      relevantNids.push({ nid, score })
    }
  }
  // Cut the long tail of results - we can't and we shouldn't show more relevant
  // results than some limit, let it be for now 42
  relevantNids.sort((ar, br) => ar.score - br.score)
  relevantNids = relevantNids.slice(0, 42)
  const nodeMap: Map<Nid, TNode> = new Map()
  {
    const resp = await storage.node.batch.get({
      nids: relevantNids.map(({ nid }) => nid),
    })
    for (const node of resp.nodes) {
      nodeMap.set(node.nid, node)
    }
  }
  const relevantNodes: RelevantNode[] = []
  for (const { nid, score } of relevantNids) {
    const node = nodeMap.get(nid)
    if (node == null) {
      log.error(
        `Mazed can't extract node for nid ${nid}, can't use it in similarity search`
      )
      continue
    }
    let matchedPiece: LongestCommonContinuousPiece | undefined = undefined
    if (NodeUtil.isWebBookmark(node)) {
      const text = [node.index_text?.plaintext ?? node.extattrs?.description]
        .filter((str: string | undefined) => !!str)
        .join(' ')
        .replace(/\s+/g, ' ')
      if (text) {
        const winkDoc = wink_.readDoc(text)
        matchedPiece = findLongestCommonContinuousPiece(
          winkDoc,
          phraseDoc,
          wink_,
          // These parameters are the subject of further iteration based on usage
          // feedback. The current limit is chosen from aesthetic reason in my
          // specific browser, with current styles - it all might look very
          // different in other devices.
          {
            prefixToExtendWordsNumber: 24,
            suffixToExtendWordsNumber: 92,
            // Cut search if long enough quote is found.
            maxLengthOfCommonPieceWordsNumber: 36,
          }
        )
      }
    }
    relevantNodes.push({ node, score, matchedPiece })
  }
  log.debug('Similarity search results', relevantNodes)
  return relevantNodes
}

function getNodePatchAsString(patch: NodeEventPatch): string {
  const ret: string[] = [
    patch.extattrs?.author ?? '',
    patch.extattrs?.title ?? '',
    patch.extattrs?.web_quote?.text ?? '',
    patch.index_text?.plaintext ?? '',
  ]
  const text = patch.text
  if (text) {
    const coment = TDoc.fromNodeTextData(text)
    ret.push(coment.genPlainText())
  }
  return ret.join('\n')
}

async function updateNodeIndex(
  storage: StorageApi,
  nid: Nid,
  patch: NodeEventPatch
): Promise<void> {
  if (tfState == null) {
    log.error('Similarity search state is not initialised')
    return
  }
  const text = getNodePatchAsString(patch)
  const textWinkDoc = wink_.readDoc(text)
  const embedding = await tfState.encoder.embed(
    textWinkDoc.out(wink_.its.normal)
  )
  const embeddingJson = tfUse.tensor2dToJson(embedding)
  await storage.node.setNodeSimilaritySearchInfo({
    nid,
    simsearch: {
      algorithm: 'tf-embed',
      version: 1,
      embeddingJson,
    },
  })
}

function createNodeEventListener(storage: StorageApi): NodeEventListener {
  return (type: NodeEventType, nid: Nid, patch: NodeEventPatch) => {
    if (type === 'created' || type === 'updated') {
      updateNodeIndex(storage, nid, patch)
    }
  }
}

async function ensurePerNodeSimSearchIndexIntegrity(
  storage: StorageApi
): Promise<void> {
  const nids = await storage.node.getAllNids({})
  for (let ind = 0; ind < nids.length; ++ind) {
    const nid = nids[ind]
    const nodeSimSearchInfo = await storage.node.getNodeSimilaritySearchInfo({
      nid,
    })
    if (
      !tfUse.isPerDocIndexUpToDate(
        nodeSimSearchInfo?.algorithm,
        nodeSimSearchInfo?.version
      )
    ) {
      log.debug(
        `Update node similarity index [${ind + 1}/${nids.length}] ${nid}`
      )
      const node = await storage.node.get({ nid })
      updateNodeIndex(storage, nid, { ...node })
    }
  }
}

export async function register(storage: StorageApi) {
  tfState = await tfUse.createTfState()

  // Run it as non-blocking async call
  ensurePerNodeSimSearchIndexIntegrity(storage)

  const nodeEventListener = createNodeEventListener(storage)
  storage.node.addListener(nodeEventListener)
  log.debug('Similarity search module is loaded')
  return () => {
    storage.node.removeListener(nodeEventListener)
  }
}
