import {
  bm25,
  findLongestCommonContinuousPiece,
  tfUse,
  WinkDocument,
  WinkMethods,
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

let tfIndex: tfUse.TfIndex | null = null
let tfPerDocumentIndex: tfUse.TfPerDocumentIndex<DocId>[] = []

const useTfSimilaritySearch: boolean = true

function findLongestCommonContinuousPieceForNode(
  node: TNode,
  phraseDoc: WinkDocument,
  wink: WinkMethods,
): LongestCommonContinuousPiece | undefined {
  if (!NodeUtil.isWebBookmark(node)) {
    return undefined }
      const text = [node.extattrs?.description, node.index_text?.plaintext]
        .filter((str: string | undefined) => !!str)
        .join(' ')
        .replace(/\s+/g, ' ')
      const winkDoc = wink.readDoc(text)
      return findLongestCommonContinuousPiece(
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

export type RelevantNode = {
  node: TNode
  // score: bm25.TextScore
  matchedPiece?: LongestCommonContinuousPiece
}
export async function findRelevantNodes(
  phrase: string,
  storage: StorageApi,
  limit?: number,
  excludedNids?: Set<Nid>
): Promise<RelevantNode[]> {
  const { wink } = overallIndex.model
  const phraseDoc = wink.readDoc(phrase)
  if (useTfSimilaritySearch) {
    if (tfIndex == null) {
      return []
    }
    const pattern = await tfIndex.encoder.embed(phrase)
    const results = tfUse.findRelevantDocuments(pattern, tfPerDocumentIndex, 1.0).filter((r) =>
      excludedNids != null ? !excludedNids.has(r.docId.nid) : true
    )
    const nids: Nid[] = results.map(({ docId }) => docId.nid)
    const resp = await storage.node.batch.get({ nids })
    const nodeMap: Map<Nid, TNode> = new Map()
    for (const node of resp.nodes) {
      nodeMap.set(node.nid, node)
    }
    return results.map(({ docId }) => {
      const { nid } = docId
      const node = nodeMap.get(nid)
      if (node == null) {
        return null
      }
      const relevantNode: RelevantNode = {
        node,
        matchedPiece: findLongestCommonContinuousPieceForNode(node, phraseDoc, wink)
      }
      return relevantNode
    }).filter(item => !!item) as RelevantNode[]
  }

  const sizeLimit = limit ?? 16
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
      const text = [node.extattrs?.description, node.index_text?.plaintext]
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
    relevantNodes.push({ node, matchedPiece })
  }
  log.debug('Similarity search results', relevantNodes)
  return relevantNodes
}

function addNodeSection(docId: DocId, text: string): void {
  perDocumentIndex.push(bm25.addDocument(overallIndex, text, docId))
}

async function tfAddNode(nid: Nid, patch: NodeEventPatch): Promise<void> {
  if (tfIndex == null) {
    return
  }
  const text = [
    patch.extattrs?.title,
    patch.extattrs?.author,
    patch.extattrs?.description,
    patch.extattrs?.web_quote?.text,
    patch.text == null ? null : TDoc.fromNodeTextData(patch.text),
    patch.index_text,
    patch.extattrs?.web?.url,
    patch.extattrs?.web_quote?.url,
    patch.extattrs?.web_quote?.text
  ].filter((str) => !!str).join('\n')
  const perDocument = await tfUse.addDocument<DocId>(text, { nid, section: 'text' }, tfIndex)
  tfPerDocumentIndex.push(perDocument)
}

async function tfRemoveNode(nid: Nid): Promise<void> {
  for (let ind = 0; ind < tfPerDocumentIndex.length; ++ind) {
    const item = tfPerDocumentIndex[ind]
    const itemDocId = item.docId
    if (itemDocId.nid === nid) {
      perDocumentIndex.splice(ind, 1)
    }
  }
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
function removeEntireNode(nid: Nid): void {
  for (let ind = 0; ind < perDocumentIndex.length; ++ind) {
    const item = perDocumentIndex[ind]
    const itemDocId = item.docId
    if (itemDocId.nid === nid) {
      perDocumentIndex.splice(ind, 1)
    }
  }
}

const nodeEventListener: NodeEventListener = (
  type: NodeEventType,
  nid: Nid,
  patch: NodeEventPatch
) => {
  if (type === 'deleted') {
    removeEntireNode(nid)
    tfRemoveNode(nid)
  } else if (type === 'created' || type === 'updated') {
    if (type === 'updated') {
      tfRemoveNode(nid)
    }
    tfAddNode(nid, patch)

    const author = patch.extattrs?.author
    if (author) {
      const docId: DocId = { nid, section: 'author' }
      if (type === 'updated') {
        removeNodeSection(docId)
      }
      addNodeSection(docId, author)
    }
    const title = patch.extattrs?.title
    if (title) {
      const docId: DocId = { nid, section: 'title' }
      if (type === 'updated') {
        removeNodeSection(docId)
      }
      addNodeSection(docId, title)
    }
    const description = patch.extattrs?.description
    if (description) {
      const docId: DocId = { nid, section: 'description' }
      if (type === 'updated') {
        removeNodeSection(docId)
      }
      addNodeSection(docId, description)
    }
    const web_quote = patch.extattrs?.web_quote?.text
    if (web_quote) {
      const docId: DocId = { nid, section: 'web-quote' }
      if (type === 'updated') {
        removeNodeSection(docId)
      }
      addNodeSection(docId, web_quote)
    }
    const text = patch.text
    if (text) {
      const coment = TDoc.fromNodeTextData(text)
      if (coment.getTextLength() > 4) {
        const docId: DocId = { nid, section: 'text' }
        if (type === 'updated') {
          removeNodeSection(docId)
        }
        addNodeSection(docId, coment.genPlainText())
      }
    }
    const index_text = patch.index_text
    if (index_text) {
      const text =
        (index_text?.plaintext ?? '') +
        (index_text?.brands ?? []).concat(index_text?.labels ?? []).join(' ')
      const docId: DocId = { nid, section: 'index-text' }
      if (type === 'updated') {
        removeNodeSection(docId)
      }
      addNodeSection(docId, text)
    }
    // TODO(Alexander): Split urls into a separate words here
    // if (url != null) {
    //   log.debug("node.url", node.nid, url)
    // }
  }
}

export function addNode(node: TNode): void {
  nodeEventListener('created', node.nid, { ...node })
}

export async function register(storage: StorageApi) {
  {
    const [index, perDocument] = await tfUse.createIndex<DocId>()
    tfIndex = index
    tfPerDocumentIndex = perDocument
  }
  log.debug('Start loading model', new Date())
  const iter = await storage.node.iterate()
  log.debug('Model is loaded', new Date())
  while (true) {
    const node = await iter.next()
    if (node) {
      addNode(node)
    } else {
      break
    }
  }
  log.debug('documentsNumber', overallIndex.documentsNumber, new Date())
  log.debug('wordsInAllDocuments', overallIndex.wordsInAllDocuments)
  log.debug('bagOfWords', overallIndex.bagOfWords)
  storage.node.addListener(nodeEventListener)
  return () => {
    storage.node.removeListener(nodeEventListener)
  }
}
