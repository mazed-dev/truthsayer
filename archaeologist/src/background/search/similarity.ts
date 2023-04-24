import {
  bm25,
  findLongestCommonContinuousPiece,
  tfUse,
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

type NodeSectionType =
  | 'title'
  | 'author'
  | 'description'
  | 'url'
  | 'index-text'
  | 'web-quote'
  | 'text'

export type DocId = {
  nid: Nid
  section: NodeSectionType
}

const [overallIndex, perDocumentIndex] = bm25.createIndex<DocId>()

let tfState: tfUse.TfState | undefined = undefined

export type RelevantNode = {
  node: TNode
  score: bm25.TextScore
  matchedPiece?: LongestCommonContinuousPiece
}
export async function findRelevantNodes(
  phrase: string,
  storage: StorageApi,
  limit?: number,
  excludedNids?: Set<Nid>
): Promise<RelevantNode[]> {
  const sizeLimit = limit ?? 16
  const { wink } = overallIndex.model
  const phraseDoc = wink.readDoc(phrase)
  const results = bm25
    .findRelevantDocuments(
      phraseDoc,
      sizeLimit * 2,
      overallIndex,
      perDocumentIndex
    )
    .filter((r) =>
      excludedNids != null ? !excludedNids.has(r.docId.nid) : true
    )
  const maxScore: number = results[0]?.score.total
  const scoreMap: Map<Nid, bm25.TextScore> = new Map()
  const nids = results
    .filter(({ docId, score }) => {
      if (score.total * 4 > maxScore && scoreMap.size < sizeLimit) {
        const { nid } = docId
        const added = scoreMap.has(nid)
        scoreMap.set(nid, score)
        return !added
      }
      return false
    })
    .map((s) => s.docId.nid)
  const resp = await storage.node.batch.get({ nids })
  const nodeMap: Map<Nid, TNode> = new Map()
  for (const node of resp.nodes) {
    nodeMap.set(node.nid, node)
  }
  const relevantNodes: RelevantNode[] = []
  for (const nid of nids) {
    const node = nodeMap.get(nid)
    const score = scoreMap.get(nid)
    if (node == null || score == null) {
      continue
    }
    let matchedPiece: LongestCommonContinuousPiece | undefined = undefined
    if (NodeUtil.isWebBookmark(node)) {
      const text = [node.index_text?.plaintext ?? node.extattrs?.description]
        .filter((str: string | undefined) => !!str)
        .join(' ')
        .replace(/\s+/g, ' ')
      const winkDoc = wink.readDoc(text)
      matchedPiece = findLongestCommonContinuousPiece(
        winkDoc,
        phraseDoc,
        wink,
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
    relevantNodes.push({ node, score, matchedPiece })
  }
  log.debug('Similarity search results', relevantNodes)
  return relevantNodes
}

function addNodeSection(docId: DocId, text: string): void {
  perDocumentIndex.push(bm25.addDocument(overallIndex, text, docId))
}

/**
 * What we do here is a hack, we just remove document from per-document index,
 * leaving words that the document contribued to overallIndex be. In hope, that
 * those words won't mess up stats too much, so search would keep working up
 * unil next re-indexing
 */
function removeNodeSection(docId: DocId): void {
  for (let ind = 0; ind < perDocumentIndex.length; ++ind) {
    const item = perDocumentIndex[ind]
    const itemDocId = item.docId
    if (itemDocId.nid === docId.nid && itemDocId.section === docId.section) {
      perDocumentIndex.splice(ind, 1)
    }
  }
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

function removeEntireNode(nid: Nid): void {
  for (let ind = 0; ind < perDocumentIndex.length; ++ind) {
    const item = perDocumentIndex[ind]
    const itemDocId = item.docId
    if (itemDocId.nid === nid) {
      perDocumentIndex.splice(ind, 1)
    }
  }
}

async function addEntireNode(
  storage: StorageApi,
  nid: Nid,
  patch: NodeEventPatch
): Promise<void> {
  if (tfState == null) {
    log.error('Similarity search state is not initialised')
    return
  }
  const text = getNodePatchAsString(patch)
  const embedding = await tfState.encoder.embed(text)
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

const nodeEventListener: NodeEventListener = (
  type: NodeEventType,
  nid: Nid,
  patch: NodeEventPatch
) => {
  if (type === 'deleted') {
    removeEntireNode(nid)
  } else if (type === 'created') {
    addEntireNode(storage, nid, patch)
  } else if (type === 'updated') {
    removeEntireNode(nid)
  }
}

// function addNode(node: TNode): void {
//   nodeEventListener('created', node.nid, { ...node })
// }

async function ensurePerNodeSimSearchIndexIntegrity(
  storage: StorageApi
): Promise<void> {
  const nids = await storage.node.getAllNids({})
  for (const nid of nids) {
    const nodeSimSearchInfo = await storage.node.getNodeSimilaritySearchInfo({
      nid,
    })
    if (
      !tfUse.isPerDocIndexUpToDate(
        nodeSimSearchInfo?.algorithm,
        nodeSimSearchInfo?.version
      )
    ) {
      const node = await storage.node.get({ nid })
      addEntireNode(storage, nid, { ...node })
    }
  }
}

export async function register(storage: StorageApi) {
  tfState = await tfUse.createTfState()

  // Run it as non-blocking async call
  ensurePerNodeSimSearchIndexIntegrity(storage)

  storage.node.addListener(nodeEventListener)
  return () => {
    storage.node.removeListener(nodeEventListener)
  }
}
