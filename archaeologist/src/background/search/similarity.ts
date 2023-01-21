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

function addNodeSection(
  nid: Nid,
  section: NodeSectionType,
  text: string
): void {
  log.debug('Add doc to index', nid, section, text)
  perDocumentIndex.push(
    relevance.addDocument(overallIndex, text, { nid, section })
  )
}

/**
 * What we do here is a hack, we just remove document from per-document index,
 * leaving words that the document contribued to overallIndex be. In hope, that
 * those words won't mess up stats too much, so search would keep working up
 * unil next re-indexing
 */
function deleteNodeSection(
  nid: Nid,
  section: NodeSectionType,
  text: string
): void {
  perDocumentIndex.fin
    relevance.addDocument(overallIndex, text, { nid, section })
  )
}

export function addNode(node: TNode): void {
  const title = node.extattrs?.title
  const author = node.extattrs?.author
  const description = node.extattrs?.description
  const quote = node.extattrs?.web_quote?.text
  // const url = node.extattrs?.web_quote?.url ?? node.extattrs?.web?.url
  const index_text = node.index_text
  const coment = TDoc.fromNodeTextData(node.text)
  if (title != null) {
    addNodeSection(node.nid, 'title', title)
  }
  if (author != null) {
    addNodeSection(node.nid, 'author', author)
  }
  if (description != null) {
    addNodeSection(node.nid, 'description', description)
  }
  if (quote != null) {
    addNodeSection(node.nid, 'web-quote', quote)
  }
  // TODO(Alexander): Split urls into a separate words here
  // if (url != null) {
  //   log.debug("node.url", node.nid, url)
  // }
  if (index_text != null) {
    const text =
      (index_text.plaintext ?? '') +
      (index_text?.brands ?? []).concat(index_text?.labels ?? []).join(' ')
    addNodeSection(node.nid, 'index-text', text)
  }
  if (coment.getTextLength() > 4) {
    addNodeSection(node.nid, 'text', coment.genPlainText())
  }
}

const nodeEventListener: NodeEventListener = (
  type: NodeEventType,
  nid: Nid,
  patch: NodeEventPatch
) => {
  if (type === 'updated') {
    const author = patch.extattrs?.author
    if (author) {
      addNodeSection(nid, 'author', author)
    }
    const title = patch.extattrs?.title
    if (title) {
      addNodeSection(nid, 'title', title)
    }
    const description = patch.extattrs?.description
    if (description) {
      addNodeSection(nid, 'description', description)
    }
    const web_quote = patch.extattrs?.web_quote?.text
    if (web_quote) {
      addNodeSection(nid, 'web-quote', web_quote)
    }
    const text = patch.text
    if (text != null) {
      const coment = TDoc.fromNodeTextData(text)
      if (coment.getTextLength() > 4) {
        addNodeSection(nid, 'text', coment.genPlainText())
      }
    }
    const index_text = patch.index_text
    if (index_text != null) {

    }
  }
  if (type === 'created') {
    const author = patch.extattrs?.author
    if (author) {
      addNodeSection(nid, 'author', author)
    }
    const title = patch.extattrs?.title
    if (title) {
      addNodeSection(nid, 'title', title)
    }
    const description = patch.extattrs?.description
    if (description) {
      addNodeSection(nid, 'description', description)
    }
    const web_quote = patch.extattrs?.web_quote?.text
    if (web_quote) {
      addNodeSection(nid, 'web-quote', web_quote)
    }
    const text = patch.text
    if (text) {
      const coment = TDoc.fromNodeTextData(text)
      if (coment.getTextLength() > 4) {
        addNodeSection(nid, 'text', coment.genPlainText())
      }
    }
    const index_text = patch.index_text
    if (index_text) {
      const text =
        (index_text?.plaintext ?? '') +
        (index_text?.brands ?? []).concat(index_text?.labels ?? []).join(' ')
      addNodeSection(nid, 'index-text', text)
    }
  } else if (type === 'deleted') {
    // TODO(akindyakov): Implement it!
  }
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
