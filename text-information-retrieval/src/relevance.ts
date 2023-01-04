import * as bm25 from './bm25'

export namespace relevance {
  export type RelevanceIndex = bm25.OkapiBM25PlusIndex
  export type RelevancePerDocumentIndex = bm25.OkapiBM25PlusPerDocumentIndex
  export type RelevanceResult = bm25.RelevanceResult

  export function createIndex(): [RelevanceIndex, RelevancePerDocumentIndex[]] {
    return bm25.createIndex()
  }

  export function findRelevantDocuments(
    text: string,
    limit: number,
    relIndex: RelevanceIndex,
    docs: RelevancePerDocumentIndex[]
  ): RelevanceResult[] {
    return bm25.findRelevantDocuments(text, limit, relIndex, docs)
  }

  export namespace json {
    export function stringifyIndex(relIndex: RelevanceIndex): string {
      return bm25.json.stringifyIndex(relIndex)
    }

    export function parseIndex(buf: string): RelevanceIndex {
      return bm25.json.parseIndex(buf)
    }

    export function stringifyPerDocumentIndex(
      docIndex: RelevancePerDocumentIndex
    ): string {
      return bm25.json.stringifyPerDocumentIndex(docIndex)
    }

    export function parsePerDocumentIndex(
      buf: string
    ): RelevancePerDocumentIndex {
      return bm25.json.parsePerDocumentIndex(buf)
    }
  }
}
