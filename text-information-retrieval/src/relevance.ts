import * as bm25 from './bm25'

export namespace relevance {
  export type RelevanceIndex = bm25.OkapiBm25PlusIndex
  export type RelevancePerDocumentIndex<DocIdType> =
    bm25.OkapiBm25PlusPerDocumentIndex<DocIdType>
  export type RelevanceResult<DocIdType> = bm25.RelevanceResult<DocIdType>
  export type TextScore = bm25.TextScore

  export function createIndex<DocIdType>(): [
    RelevanceIndex,
    RelevancePerDocumentIndex<DocIdType>[]
  ] {
    return bm25.createIndex()
  }

  export function findRelevantDocuments<DocIdType>(
    text: string,
    limit: number,
    relIndex: RelevanceIndex,
    docs: RelevancePerDocumentIndex<DocIdType>[]
  ): RelevanceResult<DocIdType>[] {
    return bm25.findRelevantDocuments(text, limit, relIndex, docs)
  }

  export function addDocument<DocIdType>(
    overallIndex: RelevanceIndex,
    text: string,
    docId: DocIdType
  ): RelevancePerDocumentIndex<DocIdType> {
    return bm25.addDocument(overallIndex, text, docId)
  }
  export namespace json {
    export function stringifyIndex(relIndex: RelevanceIndex): string {
      return bm25.json.stringifyIndex(relIndex)
    }

    export function parseIndex(buf: string): RelevanceIndex {
      return bm25.json.parseIndex(buf)
    }

    export function stringifyPerDocumentIndex<DocIdType>(
      docIndex: RelevancePerDocumentIndex<DocIdType>
    ): string {
      return bm25.json.stringifyPerDocumentIndex(docIndex)
    }

    export function parsePerDocumentIndex<DocIdType>(
      buf: string
    ): RelevancePerDocumentIndex<DocIdType> {
      return bm25.json.parsePerDocumentIndex(buf)
    }
  }
}
