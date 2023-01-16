import { relevance } from 'text-information-retrieval'
import { StorageApi } from 'smuggler-api'
import { TDoc } from 'elementary'
import { log } from 'armoury'

import type { Nid, TNode } from 'smuggler-api'

export type DocId = {
  nid: Nid
  section:
    | 'title'
    | 'author'
    | 'description'
    | 'url'
    | 'content'
    | 'web-quote'
    | 'coment'
}

const [overallIndex, perDocumentIndex] = relevance.createIndex<DocId>()

export async function findRelevantNodes(
  text: string,
  limit?: number
): Promise<DocId[]> {
  limit = limit ?? 8
  const results = relevance.findRelevantDocuments(
    text,
    limit,
    overallIndex,
    perDocumentIndex
  )
  log.debug('Results', results)
  return results.map((r) => r.docId)
}

export function addNode(node: TNode): void {
  const title = node.extattrs?.title
  const author = node.extattrs?.author
  const description = node.extattrs?.description
  const quote = node.extattrs?.web_quote?.text
  // const url = node.extattrs?.web_quote?.url ?? node.extattrs?.web?.url
  const content = node.index_text?.plaintext
  // const labels = (node.index_text?.brands ?? []).concat(node.index_text?.labels ?? []).join(' ')
  const coment = TDoc.fromNodeTextData(node.text)
  if (title != null) {
    log.debug('node.title', node.nid, title)
    perDocumentIndex.push(
      relevance.addDocument(overallIndex, title, {
        nid: node.nid,
        section: 'coment',
      })
    )
  }
  if (author != null) {
    log.debug('node.author', node.nid, author)
    perDocumentIndex.push(
      relevance.addDocument(overallIndex, author, {
        nid: node.nid,
        section: 'coment',
      })
    )
  }
  if (description != null) {
    log.debug('node.description', node.nid, description)
    perDocumentIndex.push(
      relevance.addDocument(overallIndex, description, {
        nid: node.nid,
        section: 'coment',
      })
    )
  }
  if (quote != null) {
    log.debug('node.quote', node.nid, quote)
    perDocumentIndex.push(
      relevance.addDocument(overallIndex, quote, {
        nid: node.nid,
        section: 'coment',
      })
    )
  }
  // TODO(Alexander): Split urls into a separate words here
  // if (url != null) {
  //   log.debug("node.url", node.nid, url)
  //   perDocumentIndex.push(relevance.addDocument(overallIndex, url, {
  //     nid: node.nid,
  //     section: 'coment'
  //   }))
  // }
  if (content != null) {
    log.debug('node.content', node.nid, content)
    perDocumentIndex.push(
      relevance.addDocument(overallIndex, content, {
        nid: node.nid,
        section: 'content',
      })
    )
  }
  if (coment.getTextLength() > 4) {
    log.debug('node.coment', node.nid, coment)
    perDocumentIndex.push(
      relevance.addDocument(overallIndex, coment.genPlainText(), {
        nid: node.nid,
        section: 'coment',
      })
    )
  }
}

export async function register(
  storage: StorageApi,
) {
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
}
