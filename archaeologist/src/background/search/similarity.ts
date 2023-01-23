import { relevance } from 'text-information-retrieval'
import type {
  NodeEventType,
  NodeEventPatch,
  NodeEventListener,
  Nid,
  TNode,
} from 'smuggler-api'
import { StorageApi } from 'smuggler-api'
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

const [overallIndex, perDocumentIndex] = relevance.createIndex<DocId>()

export async function findRelevantNodes(
  text: string,
  limit?: number
): Promise<DocId[]> {
  limit = limit ?? 12
  const results = relevance.findRelevantDocuments(
    text,
    limit,
    overallIndex,
    perDocumentIndex
  )
  log.debug('Results', results)
  return results.map((r) => r.docId)
}

function addNodeSection(docId: DocId, text: string): void {
  log.debug('Add doc to index', docId, text)
  perDocumentIndex.push(relevance.addDocument(overallIndex, text, docId))
}

/**
 * What we do here is a hack, we just remove document from per-document index,
 * leaving words that the document contribued to overallIndex be. In hope, that
 * those words won't mess up stats too much, so search would keep working up
 * unil next re-indexing
 */
function removeNodeSection(docId: DocId): void {
  log.debug('Remove node section from index', docId)
  for (let ind = 0; ind < perDocumentIndex.length; ++ind) {
    const item = perDocumentIndex[ind]
    const itemDocId = item.docId
    if (itemDocId.nid === docId.nid && itemDocId.section === docId.section) {
      perDocumentIndex.splice(ind, 1)
    }
  }
}
function removeEntireNode(nid: Nid): void {
  log.debug('Remove node from index', nid)
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
  log.debug('nodeEventListener', type, nid, patch)
  if (type === 'deleted') {
    removeEntireNode(nid)
  } else if (type === 'created' || type === 'updated') {
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
  const iter = storage.node.iterate()
  while (true) {
    const node = await iter.next()
    if (node) {
      addNode(node)
    } else {
      break
    }
  }
  log.debug('documentsNumber', overallIndex.documentsNumber)
  log.debug('wordsInAllDocuments', overallIndex.wordsInAllDocuments)
  log.debug('bagOfWords', overallIndex.bagOfWords)
  storage.node.addListener(nodeEventListener)
  return () => {
    storage.node.removeListener(nodeEventListener)
  }
}
