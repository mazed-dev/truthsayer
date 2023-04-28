import { tfUse, loadWinkModel, bm25 } from 'text-information-retrieval'
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
import CancellationToken from 'cancellationtoken'
import { log, errorise } from 'armoury'

let tfState: tfUse.TfState | undefined = undefined

const wink_ = loadWinkModel()

/**
 * The cosine distance threshold below which we call two texts relevant.
 * In data analysis, cosine similarity is a measure of similarity between two
 * non-zero vectors defined in an inner product space. Cosine similarity is the
 * cosine of the angle between the vectors; that is, it is the dot product of
 * the vectors divided by the product of their lengths.
 * https://en.wikipedia.org/wiki/Cosine_similarity
 *
 * Cosine distance is a number that belongs to [0, 1], we can safely assume that
 * all texts with cos between vectors smaller than 0.42 are related. Although,
 * for some texts this similarity measurement might not work, if this is the
 * case consider using euclidean distance insted.
 */
const kSimilarityCosineDistanceThreshold = 0.42

export type RelevantNode = {
  node: TNode
  score: number
  matchedPiece?: LongestCommonContinuousPiece
}
export async function findRelevantNodes(
  phrase: string,
  storage: StorageApi,
  excludedNids: Set<Nid>,
  cancellationToken: CancellationToken
): Promise<RelevantNode[]> {
  cancellationToken.throwIfCancelled()
  if (tfState == null) {
    log.error('Similarity search state is not initialised')
    return []
  }
  const phraseDoc = wink_.readDoc(phrase)
  const phraseEmbedding = await tfState.encoder.embed(
    phraseDoc.out(wink_.its.normal)
  )
  const allNids = await storage.node.getAllNids({})
  cancellationToken.throwIfCancelled()
  let relevantNids: { score: number; nid: Nid }[] = []
  for (const nid of allNids) {
    if (!!excludedNids.has(nid)) {
      continue
    }
    const nodeSimSearchInfo = await storage.node.similarity.getIndex({
      nid,
    })
    if (
      nodeSimSearchInfo == null ||
      !tfUse.isPerDocIndexUpToDate(
        nodeSimSearchInfo?.signature.algorithm,
        nodeSimSearchInfo?.signature.version
      )
    ) {
      // Skip nodes with invalid index
      log.warning(
        `Similarity index for node ${nid} is invalid "${nodeSimSearchInfo?.signature.algorithm}:${nodeSimSearchInfo?.signature.version}"`
      )
      continue
    }
    const nodeEmbedding = tfUse.tensor2dFromJson(
      nodeSimSearchInfo.embeddingJson
    )
    // const score = tfUse.euclideanDistance(phraseEmbedding, nodeEmbedding)
    const score = tfUse.cosineDistance(phraseEmbedding, nodeEmbedding)
    if (score < kSimilarityCosineDistanceThreshold) {
      relevantNids.push({ nid, score })
    }
    cancellationToken.throwIfCancelled()
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
  cancellationToken.throwIfCancelled()
  const relevantNodes: RelevantNode[] = []
  for (const { nid, score } of relevantNids) {
    const node = nodeMap.get(nid)
    if (node == null) {
      log.error(
        `Mazed can't extract node for nid ${nid}, can't use it in similarity search`
      )
      continue
    }
    relevantNodes.push({
      node,
      score,
      matchedPiece: findRelevantQuote(phraseDoc, node),
    })
    cancellationToken.throwIfCancelled()
  }
  log.debug('Similarity search results', relevantNodes)
  return relevantNodes
}

function findRelevantQuote(
  phraseDoc: bm25.WinkDocument,
  node: TNode
): LongestCommonContinuousPiece | undefined {
  if (!NodeUtil.isWebBookmark(node)) {
    return undefined
  }
  const text = [node.index_text?.plaintext ?? node.extattrs?.description]
    .filter((str: string | undefined) => !!str)
    .join(' ')
    .replace(/\s+/g, ' ')
  if (!text) {
    return undefined
  }
  const [overallIndex, perSentenceIndexes] = bm25.createIndex<number>()
  const winkDoc = wink_.readDoc(text)
  const sentences = winkDoc.sentences().out(wink_.its.value)
  for (let ind = 0; ind < sentences.length; ++ind) {
    const sentense = sentences[ind]
    const sentenceInd = bm25.addDocument<number>(
      wink_,
      overallIndex,
      sentense,
      ind
    )
    perSentenceIndexes.push(sentenceInd)
  }
  const relevantIndexes = bm25.findRelevantDocuments<number>(
    wink_,
    phraseDoc,
    1 /* limit */,
    overallIndex,
    perSentenceIndexes
  )
  if (relevantIndexes.length === 0) {
    return undefined
  }
  const relevantSentenceIndex = relevantIndexes[0].docId
  let prefix: string
  let suffix: string
  if (relevantSentenceIndex === 0) {
    prefix = ''
    // If there is no prefix to show, use longer suffix of 3 sentenses to add
    // equal volume of context to the relevant sentense
    suffix = sentences
      .slice(relevantSentenceIndex + 1, relevantSentenceIndex + 4)
      .join(' ')
  } else {
    // Use following 2 sentenses as a suffix
    suffix = sentences
      .slice(relevantSentenceIndex + 1, relevantSentenceIndex + 3)
      .join(' ')
    if (suffix === '' && relevantSentenceIndex > 1) {
      // If there is no suffix to show, use longer prefix
      prefix = sentences
        .slice(relevantSentenceIndex - 2, relevantSentenceIndex)
        .join(' ')
    } else {
      // Use previous sentence as prefix
      prefix = sentences[relevantSentenceIndex - 1]
    }
  }
  return {
    matchTokensCount: 100, // Not released
    matchValuableTokensCount: 100, // Not released
    match: sentences[relevantSentenceIndex],
    prefix,
    suffix,
  }
}

function getNodePatchAsString(patch: NodeEventPatch): string {
  const ret: string[] = [
    patch.extattrs?.title ?? '',
    patch.index_text?.plaintext ?? '',
    patch.extattrs?.web_quote?.text ?? '',
    patch.extattrs?.author ?? '',
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
  await storage.node.similarity.setIndex({
    nid,
    simsearch: {
      signature: tfUse.getExpectedSignature(),
      embeddingJson,
    },
  })
}

function createNodeEventListener(storage: StorageApi): NodeEventListener {
  return (type: NodeEventType, nid: Nid, patch: NodeEventPatch) => {
    if (type === 'created' || type === 'updated') {
      updateNodeIndex(storage, nid, patch).catch((reason) => {
        log.error(
          `Failed to ensure similarity search index integrity: ${
            errorise(reason).message
          }`
        )
      })
    }
  }
}

async function ensurePerNodeSimSearchIndexIntegrity(
  storage: StorageApi
): Promise<void> {
  const nids = await storage.node.getAllNids({})
  for (let ind = 0; ind < nids.length; ++ind) {
    const nid = nids[ind]
    const nodeSimSearchInfo = await storage.node.similarity.getIndex({
      nid,
    })
    if (
      !tfUse.isPerDocIndexUpToDate(
        nodeSimSearchInfo?.signature.algorithm,
        nodeSimSearchInfo?.signature.version
      )
    ) {
      log.info(
        `Update node similarity index [${ind + 1}/${nids.length}] ${nid}`
      )
      const node = await storage.node.get({ nid })
      await updateNodeIndex(storage, nid, { ...node })
    }
  }
}

export async function register(storage: StorageApi) {
  if (tfState != null) {
    tfState = await tfUse.createTfState()
  }

  // Run it as non-blocking async call
  ensurePerNodeSimSearchIndexIntegrity(storage).catch((reason) => {
    log.error(
      `Failed to ensure similarity search index integrity: ${
        errorise(reason).message
      }`
    )
  })

  const nodeEventListener = createNodeEventListener(storage)
  storage.node.addListener(nodeEventListener)
  log.debug('Similarity search module is loaded')
  return () => {
    storage.node.removeListener(nodeEventListener)
    tfState = undefined
  }
}
