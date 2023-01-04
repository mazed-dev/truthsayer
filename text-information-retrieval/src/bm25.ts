// Load wink-nlp package.
import winkNLP, { WinkMethods } from 'wink-nlp'
// Load english language model.
import model from 'wink-eng-lite-web-model'

// According to an original papaper, b ∈ [0, 1]. Default value for an unknown
// corpus is 0.75. I deliberately chose greater value, to slightly increase the
// priority of smaller documents. Greater values favour smaller documents.
// Please feel free to reconsider all these values when you get more insights.
const kOkapiBM25PlusB = 0.92
const kOkapiBM25PlusK1 = 2.0
const kOkapiBM25PlusDelta = 1.0

type BagOfwords = Record<string, number>
/**
 * Index implementation for Okapi BM25+
 * https://en.wikipedia.org/wiki/Okapi_BM25
 */
export type OkapiBM25PlusIndex = {
  algorithm: 'Okapi BM25+'
  // Keep version around in case we need to patch the implementation and
  // regenrate an index.
  version: 1
  // Number of documents containing term (lemma)
  // NOTE (akindyakov): It might be tempting to use "bow" acronym for "bag of
  // words" here, please don't. Because it's just too confusing in a large
  // enough codebase.
  bagOfwords: BagOfwords
  documentsNumber: number
  wordsInAllDocuments: number

  model: NlpModel
}

export type OkapiBM25PlusPerDocumentIndex = {
  algorithm: 'Okapi BM25+'
  version: 1
  // Unique docId for a document
  docId: string
  // Number of times a term (lemma) occurs in the document
  // NOTE (akindyakov): It might be tempting to use "bow" acronym for "bag of
  // words" here, please don't. Because it's just too confusing in a large
  // enough codebase.
  bagOfwords: BagOfwords
  wordsNumber: number
}

export type NlpModel = {
  wink: WinkMethods
}

function createModel(): NlpModel {
  // Instantiate winkNLP model
  const wink = winkNLP(model)
  return { wink }
}

export function createIndex(): [
  OkapiBM25PlusIndex,
  OkapiBM25PlusPerDocumentIndex[]
] {
  return [
    {
      algorithm: 'Okapi BM25+',
      version: 1,
      bagOfwords: {},
      documentsNumber: 0,
      wordsInAllDocuments: 0,
      model: createModel(),
    },
    [],
  ]
}

function createPerDocumentIndex({
  bagOfwords,
  wordsNumber,
  docId,
}: {
  bagOfwords: Record<string, number>
  wordsNumber: number
  docId: string
}): OkapiBM25PlusPerDocumentIndex {
  return {
    algorithm: 'Okapi BM25+',
    version: 1,
    bagOfwords,
    wordsNumber,
    docId,
  }
}

export namespace json {
  export function stringifyIndex(relIndex: OkapiBM25PlusIndex): string {
    const obj = {
      ...relIndex,
      model: undefined,
    }
    return JSON.stringify(obj)
  }

  export function parseIndex(buf: string): OkapiBM25PlusIndex {
    const obj = JSON.parse(buf)
    obj.model = createModel()
    return obj
  }

  export function stringifyPerDocumentIndex(
    perDocRelIndex: OkapiBM25PlusPerDocumentIndex
  ): string {
    return JSON.stringify(perDocRelIndex)
  }

  export function parsePerDocumentIndex(
    buf: string
  ): OkapiBM25PlusPerDocumentIndex {
    return JSON.parse(buf)
  }
}

function addRecordValue<K extends keyof any>(
  rec: Record<K, number>,
  key: K,
  by: number,
  defaultValue?: number
): Record<K, number> {
  const value = rec[key] ?? defaultValue ?? 0
  rec[key] = value + by
  return rec
}

function createPerDocumentIndexFromText(
  text: string,
  docId: string,
  model: NlpModel
): OkapiBM25PlusPerDocumentIndex {
  const { wink } = model
  const doc = wink.readDoc(text)
  const tokenTypes = doc.tokens().out(wink.its.type)
  const lemmas = doc
    .tokens()
    .out(wink.its.lemma)
    .filter((_lemma: string, index: number) => {
      // Filter out punctuation
      return tokenTypes[index] !== 'punctuation'
    })
  const bagOfwords = lemmas.reduce((bagOfwords: BagOfwords, lemma: string) => {
    return addRecordValue(bagOfwords, lemma, 1)
  }, {})
  const wordsNumber = lemmas.length
  return createPerDocumentIndex({
    bagOfwords,
    wordsNumber,
    docId,
  })
}

export function addDocument(
  relIndex: OkapiBM25PlusIndex,
  text: string,
  docId: string
): [OkapiBM25PlusIndex, OkapiBM25PlusPerDocumentIndex] {
  const doc = createPerDocumentIndexFromText(text, docId, relIndex.model)
  relIndex.wordsInAllDocuments += doc.wordsNumber
  relIndex.documentsNumber += 1
  for (const word in doc.bagOfwords) {
    relIndex.bagOfwords = addRecordValue(relIndex.bagOfwords, word, 1)
  }
  return [relIndex, doc]
}

function getTermInDocumentImportance(
  occurenceInDoc: number,
  documentSizeInWords: number,
  averageDocumentSizeInWords: number
): number {
  // prettier-ignore
  return (
    kOkapiBM25PlusDelta +
      (occurenceInDoc * (kOkapiBM25PlusK1 + 1)) /
        (occurenceInDoc + kOkapiBM25PlusK1 *
          (1 - kOkapiBM25PlusB + (kOkapiBM25PlusB * documentSizeInWords) /
                                    averageDocumentSizeInWords
          )
        )
  )
}

function getTermInDocumentScore(
  term: string,
  relIndex: OkapiBM25PlusIndex,
  doc: OkapiBM25PlusPerDocumentIndex,
  averageDocumentSizeInWords: number
) {
  const occurenceInDoc = doc.bagOfwords[term]
  if (occurenceInDoc == null) {
    return 0
  }
  return (
    getTermInverseDocumentFrequency(term, relIndex) *
    getTermInDocumentImportance(
      occurenceInDoc,
      doc.wordsNumber,
      averageDocumentSizeInWords
    )
  )
}

function getKeyphraseInDocumentScore(
  keywords: string[],
  relIndex: OkapiBM25PlusIndex,
  doc: OkapiBM25PlusPerDocumentIndex
) {
  const averageDocumentSizeInWords =
    relIndex.wordsInAllDocuments / relIndex.documentsNumber
  return keywords
    .map((term: string, _index: number) =>
      getTermInDocumentScore(term, relIndex, doc, averageDocumentSizeInWords)
    )
    .reduce((prev: number, current: number) => current + prev)
}

export type RelevanceResult = {
  // doc: OkapiBM25PlusPerDocumentIndex
  docId: string
  score: number
}

/**
 * Search for key phrase made by human, a classic implementation of Okapi BM25+
 * See https://en.wikipedia.org/wiki/Okapi_BM25
 *
 * It's slightly simpler than `findRelevantDocuments`, this one doesn't take
 * into account importance score of each term in `keyphrase`, assuming that
 * human know what they do when they type keyphrase.
 */
export function findRelevantDocumentsForPhrase(
  keyphrase: string,
  limit: number,
  relIndex: OkapiBM25PlusIndex,
  docs: OkapiBM25PlusPerDocumentIndex[]
): RelevanceResult[] {
  const doc = createPerDocumentIndexFromText(keyphrase, '', relIndex.model)
  const lemmas = Object.keys(doc.bagOfwords)
  const results: RelevanceResult[] = []
  docs.forEach((doc: OkapiBM25PlusPerDocumentIndex) => {
    const score = getKeyphraseInDocumentScore(lemmas, relIndex, doc)
    if (score > 1) {
      results.push({ docId: doc.docId, score })
    }
  })
  // TODO(akindyakov): Use quick partition here instead of full scale sort to
  // find K max first and sort them after to stringificantly reduce complecity
  // from O(n * log(n)) to O(n + k * log(k))
  results.sort((ar, br) => br.score - ar.score)
  return results.slice(0, limit)
}

/**
 * Importance of the term in the entire corpus (all documents) calculated as
 * term inverse document frequency.
 */
export function getTermInverseDocumentFrequency(
  term: string,
  relIndex: OkapiBM25PlusIndex
) {
  const numberOfDocumentsContainingTerm = relIndex.bagOfwords[term] ?? 0
  const x =
    1 +
    (relIndex.documentsNumber - numberOfDocumentsContainingTerm + 0.5) /
      (numberOfDocumentsContainingTerm + 0.5)
  if (x < Math.E) {
    // To avoid negative results for a frequent word, e.g. "the"
    return 0
  }
  return Math.log(x)
}

function getTextRelevanceScore(
  queryDoc: OkapiBM25PlusPerDocumentIndex,
  relIndex: OkapiBM25PlusIndex,
  corpusDoc: OkapiBM25PlusPerDocumentIndex
): number {
  const averageDocumentSizeInWords =
    relIndex.wordsInAllDocuments / relIndex.documentsNumber
  const score = Object.entries(queryDoc.bagOfwords)
    .map(([term, occurenceInQueryDoc]) => {
      const occurenceInCorpusDoc = corpusDoc.bagOfwords[term]
      if (occurenceInCorpusDoc == null) {
        return 0
      }
      return (
        getTermInverseDocumentFrequency(term, relIndex) *
        getTermInDocumentImportance(
          occurenceInCorpusDoc,
          corpusDoc.wordsNumber,
          averageDocumentSizeInWords
        ) *
        getTermInDocumentImportance(
          occurenceInQueryDoc,
          queryDoc.wordsNumber,
          averageDocumentSizeInWords
        )
      )
    })
    .reduce((prev: number, current: number) => current + prev)
  return score
}

export function findRelevantDocuments(
  text: string,
  limit: number,
  relIndex: OkapiBM25PlusIndex,
  docs: OkapiBM25PlusPerDocumentIndex[]
): RelevanceResult[] {
  const queryDoc = createPerDocumentIndexFromText(text, '', relIndex.model)
  const results: RelevanceResult[] = []
  docs.forEach((corpusDoc: OkapiBM25PlusPerDocumentIndex) => {
    const score = getTextRelevanceScore(queryDoc, relIndex, corpusDoc)
    if (score > 1) {
      results.push({ docId: corpusDoc.docId, score })
    }
  })
  // TODO(akindyakov): Use quick partition here instead of full scale sort to
  // find K max first and sort them after to stringificantly reduce complecity
  // from O(n * log(n)) to O(n + k * log(k))
  results.sort((ar, br) => br.score - ar.score)
  return results.slice(0, limit)
}
