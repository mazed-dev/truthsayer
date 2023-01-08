// Load wink-nlp package.
import winkNLP, { WinkMethods } from 'wink-nlp'
// Load english language model.
import model from 'wink-eng-lite-web-model'

// Feel free to reconsider all these values when you get more insights in type
// of texts saved to Mazed.
// From original papaper, b ∈ [0, 1]. Default for an unknown corpus is 0.75
const kOkapiBM25PlusB = 0.75
const kOkapiBM25PlusK1 = 2.0

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
  bagOfWords: BagOfWords
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
  export function stringifyIndex(overallIndex: OkapiBM25PlusIndex): string {
    const bagOfWords = Array.from(overallIndex.bagOfWords.entries())
    const obj = {
      ...overallIndex,
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
    return JSON.stringify({ ...perDocRelIndex, bagOfWords })
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
  lemmas.forEach((lemma: string) =>
    bagOfWords.set(lemma, bagOfWords.get(lemma) ?? 0 + 1)
  )
  const wordsNumber = lemmas.length
  return createPerDocumentIndex({
    bagOfWords,
    wordsNumber,
    docId,
  })
}

export function addDocument<DocIdType>(
  overallIndex: OkapiBM25PlusIndex,
  text: string,
  docId: DocIdType
): [OkapiBM25PlusIndex, OkapiBM25PlusPerDocumentIndex<DocIdType>] {
  const doc = createPerDocumentIndexFromText(text, overallIndex.model, docId)
  overallIndex.wordsInAllDocuments += doc.wordsNumber
  overallIndex.documentsNumber += 1
  for (const word of doc.bagOfWords.keys()) {
    overallIndex.bagOfWords.set(
      word,
      (overallIndex.bagOfWords.get(word) ?? 0) + 1
    )
  }
  return [overallIndex, doc]
}

/**
 *           occurence × (k1 + 1)
 * ───────────────────────────────────────────
 *                                   |D|
 *  occurence + k1 × (1 - b + b × ──────────)
 *                                 avg(|D|)
 *
 */
export function getTermInDocumentImportance(
  occurenceInDoc: number,
  documentSizeInWords: number,
  averageDocumentSizeInWords: number
): number {
  // prettier-ignore
  return (
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
  termIDF: number,
  doc: OkapiBM25PlusPerDocumentIndex<DocIdType>,
  averageDocumentSizeInWords: number
) {
  const occurenceInDoc = doc.bagOfWords.get(term)
  if (occurenceInDoc == null) {
    // Just a shortcut
    return 0
  }
  console.log('occurenceInDoc', term, occurenceInDoc, doc.wordsNumber)
  return (
    termIDF *
    getTermInDocumentImportance(
      occurenceInDoc,
      doc.wordsNumber,
      averageDocumentSizeInWords
    )
  )
}

function getKeyphraseInDocumentScore<DocIdType>(
  terms: string[],
  termsIDFs: number[],
  doc: OkapiBM25PlusPerDocumentIndex<DocIdType>,
  averageDocumentSizeInWords: number
) {
  let score = 0
  for (const index in terms) {
    const term = terms[index]
    const termIDF = termsIDFs[index]
    const termScore = getTermInDocumentScore(
      term,
      termIDF,
      doc,
      averageDocumentSizeInWords
    )
    console.log(doc.docId, term, termIDF, termScore)
    score = score + termScore
  }
  return score
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
  overallIndex: OkapiBM25PlusIndex,
  docs: OkapiBM25PlusPerDocumentIndex<DocIdType>[]
): RelevanceResult<DocIdType>[] {
  const averageDocumentSizeInWords =
    overallIndex.wordsInAllDocuments / overallIndex.documentsNumber
  const doc = createPerDocumentIndexFromText(keyphrase, overallIndex.model, {})
  const lemmas = Array.from(doc.bagOfWords.keys())
  const termsIDFs: number[] = lemmas.map((lemma: string) =>
    getTermInverseDocumentFrequency(
      overallIndex.bagOfWords.get(lemma) ?? 0,
      overallIndex.documentsNumber
    )
  )
  const results: RelevanceResult<DocIdType>[] = []
  for (const doc of docs) {
    const score = getKeyphraseInDocumentScore(
      lemmas,
      termsIDFs,
      doc,
      averageDocumentSizeInWords
    )
    if (score > 1) {
      results.push({ docId: doc.docId, score })
    }
  }
  console.log('Docs', docs.length)
  // TODO(akindyakov): Use quick partition here instead of full scale sort to
  // find K max first and sort them after to stringificantly reduce complecity
  // from O(n * log(n)) to O(n + k * log(k))
  results.sort((ar, br) => br.score - ar.score)
  return results.slice(0, limit)
}

/**
 * Importance of the term in the entire corpus (all documents) calculated as
 * term inverse document frequency.
 *
 *      N - n_i + 0.5
 * ln (─────────────── + 1)
 *        n_i + 0.5
 *
 * N - Overall number of documents
 * n_i - number of documents conflation the term
 */
export function getTermInverseDocumentFrequency(
  numberOfDocumentsContainingTerm: number,
  documentsNumber: number
) {
  const logArg =
    1 +
    (documentsNumber - numberOfDocumentsContainingTerm + 0.5) /
      (numberOfDocumentsContainingTerm + 0.5)
  if (logArg < Math.E) {
    // To avoid negative results for a frequent word, e.g. "the"
    return 0
  }
  return Math.log(logArg)
}

function getTextRelevanceScore<DocIdType>(
  queryTermsScores: [string, number][],
  averageDocumentSizeInWords: number,
  corpusDoc: OkapiBM25PlusPerDocumentIndex<DocIdType>
): number {
  let score = 0
  for (const [term, termScore] of queryTermsScores) {
    const occurenceInCorpusDoc = corpusDoc.bagOfWords.get(term)
    if (occurenceInCorpusDoc != null) {
      score =
        score +
        termScore *
          getTermInDocumentImportance(
            occurenceInCorpusDoc,
            corpusDoc.wordsNumber,
            averageDocumentSizeInWords
          )
    }
  }
  return score
}

export function findRelevantDocuments<DocIdType>(
  text: string,
  limit: number,
  overallIndex: OkapiBM25PlusIndex,
  corpusDocs: OkapiBM25PlusPerDocumentIndex<DocIdType>[]
): RelevanceResult<DocIdType>[] {
  const queryDoc = createPerDocumentIndexFromText(text, overallIndex.model, {})
  const queryDocWordsNumber = queryDoc.wordsNumber
  const queryTermsOccurences = Array.from(queryDoc.bagOfWords.entries())
  const averageDocumentSizeInWords =
    overallIndex.wordsInAllDocuments / overallIndex.documentsNumber
  const queryTermsScores = queryTermsOccurences.map(
    ([term, occurence]: [string, number]): [string, number] => {
      return [
        term,
        getTermInverseDocumentFrequency(
          overallIndex.bagOfWords.get(term) ?? 0,
          overallIndex.documentsNumber
        ) *
          getTermInDocumentImportance(
            occurence,
            queryDocWordsNumber,
            averageDocumentSizeInWords
          ),
      ]
    }
  )
  console.log('queryTermsScores', queryTermsScores)
  const results: RelevanceResult<DocIdType>[] = []
  for (const corpusDoc of corpusDocs) {
    const score = getTextRelevanceScore(
      queryTermsScores,
      averageDocumentSizeInWords,
      corpusDoc
    )
    if (score > 1) {
      results.push({ docId: corpusDoc.docId, score })
    }
  }
  // TODO(akindyakov): Use quick partition here instead of full scale sort to
  // find K max first and sort them after to stringificantly reduce complecity
  // from O(n * log(n)) to O(n + k * log(k))
  results.sort((ar, br) => br.score - ar.score)
  return results.slice(0, limit)
}
