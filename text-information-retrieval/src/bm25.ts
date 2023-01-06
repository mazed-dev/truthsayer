// Load wink-nlp package.
import winkNLP, { WinkMethods } from 'wink-nlp'
// Load english language model.
import model from 'wink-eng-lite-web-model'

// Feel free to reconsider all these values when you get more insights in type
// of texts saved to Mazed.
// According to an original papaper, b ∈ [0, 1]. Default value for an unknown
// corpus is 0.75. I deliberately chose greater value, to slightly increase the
// priority of small documents. Greater values favour smaller documents.
const kOkapiBM25PlusB = 0.91
const kOkapiBM25PlusK1 = 2.0
const kOkapiBM25PlusDelta = 1.0

/**
 * Use a proper Map and not an Object or Record<string, number> because keys
 * that are JS keywords mess up everything. Besides giving incorrect results it
 * impose a security vulnerability.
 */
type BagOfWords = Map<string, number>

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
  bagOfWords: BagOfWords
  documentsNumber: number
  wordsInAllDocuments: number

  model: NlpModel
}

export type OkapiBM25PlusPerDocumentIndex<DocIdType> = {
  algorithm: 'Okapi BM25+'
  version: 1
  // Unique docId for a document
  docId: DocIdType
  // Number of times a term (lemma) occurs in the document
  // NOTE (akindyakov): It might be tempting to use "bow" acronym for "bag of
  // words" here, please don't. Because it's just too confusing in a large
  // enough codebase.
  bagOfWords: BagOfWords
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

export function createIndex<DocIdType>(): [
  OkapiBM25PlusIndex,
  OkapiBM25PlusPerDocumentIndex<DocIdType>[]
] {
  return [
    {
      algorithm: 'Okapi BM25+',
      version: 1,
      bagOfWords: new Map(),
      documentsNumber: 0,
      wordsInAllDocuments: 0,
      model: createModel(),
    },
    [],
  ]
}

function createPerDocumentIndex<DocIdType>({
  bagOfWords,
  wordsNumber,
  docId,
}: {
  bagOfWords: BagOfWords,
  wordsNumber: number
  docId: DocIdType
}): OkapiBM25PlusPerDocumentIndex<DocIdType> {
  return {
    algorithm: 'Okapi BM25+',
    version: 1,
    bagOfWords,
    wordsNumber,
    docId,
  }
}

export namespace json {
  export function stringifyIndex(relIndex: OkapiBM25PlusIndex): string {
    const bagOfWords = Array.from(relIndex.bagOfWords.entries())
    const obj = {
      ...relIndex,
      model: undefined,
      bagOfWords,
    }
    return JSON.stringify(obj)
  }

  export function parseIndex(buf: string): OkapiBM25PlusIndex {
    const obj = JSON.parse(buf)
    obj.model = createModel()
    obj.bagOfWords = new Map(obj.bagOfWords) as BagOfWords
    return obj
  }

  export function stringifyPerDocumentIndex<DocIdType>(
    perDocRelIndex: OkapiBM25PlusPerDocumentIndex<DocIdType>
  ): string {
    const bagOfWords = Array.from(perDocRelIndex.bagOfWords.entries())
    return JSON.stringify({...perDocRelIndex, bagOfWords})
  }

  export function parsePerDocumentIndex<DocIdType>(
    buf: string
  ): OkapiBM25PlusPerDocumentIndex<DocIdType> {
    const obj = JSON.parse(buf)
    obj.bagOfWords = new Map(obj.bagOfWords) as BagOfWords
    return obj
  }
}

function createPerDocumentIndexFromText<DocIdType>(
  text: string,
  model: NlpModel,
  docId: DocIdType
): OkapiBM25PlusPerDocumentIndex<DocIdType> {
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
  const bagOfWords: BagOfWords = new Map()
  lemmas.forEach((lemma: string) => bagOfWords.set(lemma, bagOfWords.get(lemma) ?? 0 + 1))
  const wordsNumber = lemmas.length
  return createPerDocumentIndex({
    bagOfWords,
    wordsNumber,
    docId,
  })
}

export function addDocument<DocIdType>(
  relIndex: OkapiBM25PlusIndex,
  text: string,
  docId: DocIdType
): [OkapiBM25PlusIndex, OkapiBM25PlusPerDocumentIndex<DocIdType>] {
  const doc = createPerDocumentIndexFromText(text, relIndex.model, docId)
  relIndex.wordsInAllDocuments += doc.wordsNumber
  relIndex.documentsNumber += 1
  for (const word of doc.bagOfWords.keys()) {
    relIndex.bagOfWords.set(
      word,
      (relIndex.bagOfWords.get(word) ?? 0) + 1,
    )
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

function getTermInDocumentScore<DocIdType>(
  term: string,
  relIndex: OkapiBM25PlusIndex,
  doc: OkapiBM25PlusPerDocumentIndex<DocIdType>,
  averageDocumentSizeInWords: number
) {
  const occurenceInDoc = doc.bagOfWords.get(term)
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

function getKeyphraseInDocumentScore<DocIdType>(
  keywords: string[],
  relIndex: OkapiBM25PlusIndex,
  doc: OkapiBM25PlusPerDocumentIndex<DocIdType>
) {
  const averageDocumentSizeInWords =
    relIndex.wordsInAllDocuments / relIndex.documentsNumber
  return keywords
    .map((term: string, _index: number) =>
      getTermInDocumentScore(term, relIndex, doc, averageDocumentSizeInWords)
    )
    .reduce((prev: number, current: number) => current + prev)
}

export type RelevanceResult<DocIdType> = {
  // doc: OkapiBM25PlusPerDocumentIndex
  docId: DocIdType
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
export function findRelevantDocumentsForPhrase<DocIdType>(
  keyphrase: string,
  limit: number,
  relIndex: OkapiBM25PlusIndex,
  docs: OkapiBM25PlusPerDocumentIndex<DocIdType>[]
): RelevanceResult<DocIdType>[] {
  const doc = createPerDocumentIndexFromText(keyphrase, relIndex.model, {})
  const lemmas = Array.from(doc.bagOfWords.keys())
  const results: RelevanceResult<DocIdType>[] = []
  docs.forEach((doc: OkapiBM25PlusPerDocumentIndex<DocIdType>) => {
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
  const numberOfDocumentsContainingTerm = relIndex.bagOfWords.get(term) ?? 0
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

function getTextRelevanceScore<DocIdType>(
  queryDoc: OkapiBM25PlusPerDocumentIndex<DocIdType>,
  relIndex: OkapiBM25PlusIndex,
  corpusDoc: OkapiBM25PlusPerDocumentIndex<DocIdType>
): number {
  const averageDocumentSizeInWords =
    relIndex.wordsInAllDocuments / relIndex.documentsNumber
  let score = 0
  for (const [term, occurenceInQueryDoc] of queryDoc.bagOfWords) {
    const occurenceInCorpusDoc = corpusDoc.bagOfWords.get(term)
    if (occurenceInCorpusDoc === undefined) {
      continue
    }
    score += (
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
  }
  return score
}

export function findRelevantDocuments<DocIdType>(
  text: string,
  limit: number,
  relIndex: OkapiBM25PlusIndex,
  docs: OkapiBM25PlusPerDocumentIndex<DocIdType>[]
): RelevanceResult<DocIdType>[] {
  const queryDoc = createPerDocumentIndexFromText(text, relIndex.model, {})
  const results: RelevanceResult<DocIdType>[] = []
  docs.forEach((corpusDoc: OkapiBM25PlusPerDocumentIndex<DocIdType>) => {
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
