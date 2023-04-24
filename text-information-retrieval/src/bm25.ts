// Load wink-nlp package.
import winkNLP, { WinkMethods, Document as WinkDocument } from 'wink-nlp'
// Load english language model.
import model from 'wink-eng-lite-web-model'

import { isStopWord } from './stopWord'
import { log } from 'armoury'

// Feel free to reconsider all these values when you get more insights in type
// of texts saved to Mazed.
// From original papaper, b ∈ [0, 1]. Default for an unknown corpus is 0.75
const kOkapiBm25PlusB = 0.75
const kOkapiBm25PlusK1 = 1.4

/**
 * Use a proper Map and not an Object or Record<string, number> because keys
 * that are JS keywords mess up everything. Besides giving incorrect results it
 * impose a security vulnerability.
 */
type BagOfWords = Map<string, number>

type ScorePerWord = Map<string, number>

export type TextScore = {
  total: number
  perWord: ScorePerWord
}

/**
 * Index implementation for Okapi BM25
 * https://en.wikipedia.org/wiki/Okapi_BM25
 */
export type OkapiBm25PlusIndex = {
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

export type OkapiBm25PlusPerDocumentIndex<DocIdType> = {
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

export function loadWinkModel(): NlpModel {
  // Instantiate winkNLP model
  const wink = winkNLP(model)
  return { wink }
}

export function createIndex<DocIdType>(): [
  OkapiBm25PlusIndex,
  OkapiBm25PlusPerDocumentIndex<DocIdType>[]
] {
  return [
    {
      algorithm: 'Okapi BM25+',
      version: 1,
      bagOfWords: new Map(),
      documentsNumber: 0,
      wordsInAllDocuments: 0,
      model: loadWinkModel(),
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
}): OkapiBm25PlusPerDocumentIndex<DocIdType> {
  return {
    algorithm: 'Okapi BM25+',
    version: 1,
    bagOfWords,
    wordsNumber,
    docId,
  }
}

export namespace json {
  export function stringifyIndex(overallIndex: OkapiBm25PlusIndex): string {
    const bagOfWords = Array.from(overallIndex.bagOfWords.entries())
    const obj = {
      ...overallIndex,
      model: undefined,
      bagOfWords,
    }
    return JSON.stringify(obj)
  }

  export function parseIndex(buf: string): OkapiBm25PlusIndex {
    const obj = JSON.parse(buf)
    obj.model = loadWinkModel()
    obj.bagOfWords = new Map(obj.bagOfWords) as BagOfWords
    return obj
  }

  export function stringifyPerDocumentIndex<DocIdType>(
    perDocRelIndex: OkapiBm25PlusPerDocumentIndex<DocIdType>
  ): string {
    const bagOfWords = Array.from(perDocRelIndex.bagOfWords.entries())
    return JSON.stringify({ ...perDocRelIndex, bagOfWords })
  }

  export function parsePerDocumentIndex<DocIdType>(
    buf: string
  ): OkapiBm25PlusPerDocumentIndex<DocIdType> {
    const obj = JSON.parse(buf)
    obj.bagOfWords = new Map(obj.bagOfWords) as BagOfWords
    return obj
  }
}

const kTokenTypesToIgnore = new Set([
  'punctuation',
  'symbol',
  'tabCRLF',
  // Emoticon is a text style emoji such as :'D , differ from emoji.
  // Quite often some valid punctuation constructions are taken as emoticon, so
  // we ignore it for now.
  'emoticon',
])

function isImportantTokenType(tokenType: string, token: string): boolean {
  if (tokenType === 'unk' && token.length < 4) {
    // Ignore all unknown token shorter than 4 bytes, it's a hack to ignore
    // short tokens from unknown languages. For instance:
    // Ignore: "β", "γ"
    // Take: "παρά", "オデッセイ"
    return false
  }
  return !kTokenTypesToIgnore.has(tokenType)
}

function createPerDocumentIndexFromText<DocIdType>(
  text: WinkDocument,
  model: NlpModel,
  docId: DocIdType
): OkapiBm25PlusPerDocumentIndex<DocIdType> {
  const { wink } = model
  const tokenTypes = text.tokens().out(wink.its.type)
  const bagOfWords: BagOfWords = new Map()
  let wordsNumber = 0
  const tokens = text.tokens().out(wink.its.lemma)
  for (const index in tokens) {
    const tokenType = tokenTypes[index]
    const token = tokens[index]
    // We use our own very small list of stop wors here and do not use the
    // 'stopWord' flag from wink NLP because it filters out too many potentially
    // important words such number names.
    if (isImportantTokenType(tokenType, token) && !isStopWord(token)) {
      // TODO(Alexander): take care of the "time" token, converting it into
      // common format perhaps
      // TODO(Alexander): take care of the "url" token, as an option split it
      // into parts, split path by /[\/_]/ and domain name by '.'
      bagOfWords.set(token, (bagOfWords.get(token) ?? 0) + 1)
      ++wordsNumber
    }
  }
  return createPerDocumentIndex({
    bagOfWords,
    wordsNumber,
    docId,
  })
}

export function addDocument<DocIdType>(
  overallIndex: OkapiBm25PlusIndex,
  text: string,
  docId: DocIdType
): OkapiBm25PlusPerDocumentIndex<DocIdType> {
  const doc = createPerDocumentIndexFromText(
    overallIndex.model.wink.readDoc(text),
    overallIndex.model,
    docId
  )
  overallIndex.wordsInAllDocuments += doc.wordsNumber
  overallIndex.documentsNumber += 1
  for (const word of doc.bagOfWords.keys()) {
    overallIndex.bagOfWords.set(
      word,
      (overallIndex.bagOfWords.get(word) ?? 0) + 1
    )
  }
  return doc
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
      (occurenceInDoc * (kOkapiBm25PlusK1 + 1)) /
        (occurenceInDoc + kOkapiBm25PlusK1 *
          (1 - kOkapiBm25PlusB + (kOkapiBm25PlusB * documentSizeInWords) /
                                    averageDocumentSizeInWords
          )
        )
  )
}

function getTermInDocumentScore<DocIdType>(
  term: string,
  termIDF: number,
  doc: OkapiBm25PlusPerDocumentIndex<DocIdType>,
  averageDocumentSizeInWords: number
) {
  const occurenceInDoc = doc.bagOfWords.get(term)
  if (occurenceInDoc == null) {
    // Just a shortcut
    return 0
  }
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
  doc: OkapiBm25PlusPerDocumentIndex<DocIdType>,
  averageDocumentSizeInWords: number
): TextScore {
  let totalScore = 0
  const scorePerTerm: ScorePerWord = new Map()
  for (const index in terms) {
    const term = terms[index]
    const termIDF = termsIDFs[index]
    const termScore = getTermInDocumentScore(
      term,
      termIDF,
      doc,
      averageDocumentSizeInWords
    )
    scorePerTerm.set(term, termScore)
    totalScore += termScore
  }
  return { total: totalScore, perWord: scorePerTerm }
}

export type RelevanceResult<DocIdType> = {
  // doc: OkapiBm25PlusPerDocumentIndex
  docId: DocIdType
  score: TextScore
}

/**
 * Search for key phrase made by human, a classic implementation of Okapi BM25
 * See https://en.wikipedia.org/wiki/Okapi_BM25
 *
 * It's slightly simpler than `findRelevantDocuments`, this one doesn't take
 * into account importance score of each term in `keyphrase`, assuming that
 * human know what they do when they type keyphrase.
 */
export function findRelevantDocumentsForPhrase<DocIdType>(
  keyphrase: WinkDocument,
  limit: number,
  overallIndex: OkapiBm25PlusIndex,
  docs: OkapiBm25PlusPerDocumentIndex<DocIdType>[]
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
    if (score.total > 1) {
      results.push({ docId: doc.docId, score })
    }
  }
  // TODO(akindyakov): Use quick partition here instead of full scale sort to
  // find K max first and sort them after to stringificantly reduce complecity
  // from O(n * log(n)) to O(n + k * log(k))
  results.sort((ar, br) => br.score.total - ar.score.total)
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
  corpusDoc: OkapiBm25PlusPerDocumentIndex<DocIdType>
): TextScore {
  let totalScore = 0
  const scorePerWord: ScorePerWord = new Map()
  for (const [term, queryTermScore] of queryTermsScores) {
    const occurenceInCorpusDoc = corpusDoc.bagOfWords.get(term) ?? 0
    const termScore =
      queryTermScore *
      getTermInDocumentImportance(
        occurenceInCorpusDoc,
        corpusDoc.wordsNumber,
        averageDocumentSizeInWords
      )
    scorePerWord.set(term, termScore)
    totalScore += termScore
  }
  return { total: totalScore, perWord: scorePerWord }
}

export function findRelevantDocuments<DocIdType>(
  text: WinkDocument,
  limit: number,
  overallIndex: OkapiBm25PlusIndex,
  corpusDocs: OkapiBm25PlusPerDocumentIndex<DocIdType>[]
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
  log.debug('queryTermsScores', queryTermsScores)
  const results: RelevanceResult<DocIdType>[] = []
  for (const corpusDoc of corpusDocs) {
    const score = getTextRelevanceScore(
      queryTermsScores,
      averageDocumentSizeInWords,
      corpusDoc
    )
    if (score.total > 1) {
      results.push({ docId: corpusDoc.docId, score })
    }
  }
  // TODO(akindyakov): Use quick partition here instead of full scale sort to
  // find K max first and sort them after to stringificantly reduce complecity
  // from O(n * log(n)) to O(n + k * log(k))
  results.sort((ar, br) => br.score.total - ar.score.total)
  return results.slice(0, limit)
}
