// Load wink-nlp package.
import winkNLP, {PartOfSpeech, Bow} from 'wink-nlp'
// Load english language model.
import model from 'wink-eng-lite-web-model'

const stopWords = new Set([
])

const kOkapiBM25PlusB = 0.75
const kOkapiBM25PlusK1 = 0.75
const kOkapiBM25PlusDelta = 1.0

/**
 * Index implementation for Okapi BM25+
 * https://en.wikipedia.org/wiki/Okapi_BM25
 */
type OkapiBM25PlusIndex = {
  algorithm: 'Okapi BM25+'
  // Keep version around in case we need to patch the implementation and
  // regenrate an index.
  version: 1
  // Number of documents containing term (lemma)
  // NOTE (akindyakov): It might be tempting to use "bow" acronym for "bag of
  // words" here, please don't. Because it's just too confusing in a large
  // enough codebase.
  bagOfwords: Record<string, number>
  documentNumber: number
  wordsInAllDocuments: number
}

type OkapiBM25PlusDocument = {
  algorithm: 'Okapi BM25+'
  version: 1
  // Number of times a term (lemma) occurs in the document
  // NOTE (akindyakov): It might be tempting to use "bow" acronym for "bag of
  // words" here, please don't. Because it's just too confusing in a large
  // enough codebase.
  bagOfwords: Record<string, number>
  wordNumber: number
}

type SearchIndex = OkapiBM25PlusIndex
type SearchDocumentIndex = OkapiBM25PlusDocument
type Documents = {
  documents: SearchDocumentIndex[]
}

// Instantiate winkNLP.
const nlp = winkNLP(model)
// Obtain "its" helper to extract item properties.
const its = nlp.its
// Obtain "as" reducer helper to reduce a collection.
const as = nlp.as

function createSearchIndex(): [SearchIndex, SearchDocumentIndex[]] {
  return [{
    algorithm: 'Okapi BM25+',
    version: 1,
    bagOfwords: {},
    documentNumber: 0,
    wordsInAllDocuments: 0,
  }, []]
}

function createSearchDocumentIndex({
  bagOfwords,
  wordNumber,
}: {
  bagOfwords: Record<string, number>
  wordNumber: number
}): SearchDocumentIndex {
  return {
    algorithm: 'Okapi BM25+',
    version: 1,
    bagOfwords,
    wordNumber,
  }
}

function addRecordValue<K extends keyof any>(rec: Record<K, number>, key: K, by: number, defaultValue?: number): Record<K, number> {
  const value = rec[key] ?? defaultValue ?? 0
  rec[key] = value + by
  return rec
}

export function addDocument(sIndex: SearchIndex, text: string): [SearchIndex, SearchDocumentIndex] {
  const doc = nlp.readDoc(text)
  //console.log('Doc', doc.out())
  const tokenTypes = doc.tokens().out(its.type)
  const tokenStopWordFlags = doc.tokens().out(its.stopWordFlag)
  // console.log('tokenTypes', tokenTypes)
  // console.log('tokenStopWordFlags', tokenStopWordFlags)
  // console.log('tokenPartOfSpeach', doc.tokens().out(its.pos))
  const lemmas = doc.tokens().out(its.lemma).filter((_lemma: string, index: number) => {
    // Filter out stop words and punctuation
    return !tokenStopWordFlags[index] && tokenTypes[index] != 'punctuation'
  })
  //console.log("Lemmas", lemmas)
  const bagOfwords = lemmas.reduce((bagOfwords: Bow, lemma: string) => {
    return addRecordValue(bagOfwords, lemma, 1, 0)
    //const counter = bagOfwords[lemma] ?? 0
    //bagOfwords[lemma] = counter + 1
    //return bagOfwords
  }, {})
  // console.log('Bow', bagOfwords)
  const wordNumber = lemmas.length
  sIndex.wordsInAllDocuments += wordNumber
  sIndex.documentNumber += 1
  for (const word in bagOfwords) {
    //const counter = sIndex.bagOfwords[word] ?? 0
    //sIndex.bagOfwords[word] = counter + 1
    sIndex.bagOfwords = addRecordValue(sIndex.bagOfwords, word, 1, 0)
  }
  return [sIndex, createSearchDocumentIndex({
    bagOfwords,
    wordNumber,
  })]
}

export function getScore(keywords: string[], sIndex: SearchIndex, doc: SearchDocumentIndex) {
  return keywords.map((keyword: string, _index: number) => {
    const occurenceInDoc = doc.bagOfwords[keyword]
    if (occurenceInDoc == null) {
      return 0
    }
    const averageDocumentSizeInWords = sIndex.wordsInAllDocuments / sIndex.documentNumber
    return getTermInverseDocumentFrequency(keyword, sIndex) * (
      kOkapiBM25PlusDelta + (
        occurenceInDoc * (kOkapiBM25PlusK1 + 1)
      ) / (
        occurenceInDoc + kOkapiBM25PlusK1 * (1 - kOkapiBM25PlusB + kOkapiBM25PlusB * doc.wordNumber / averageDocumentSizeInWords)
      )
    )
  }).reduce((prev: number, current: number) => current + prev)
}

export function getTermInverseDocumentFrequency(term: string, sIndex: SearchIndex) {
  const numberOfDocumentsContainingTerm = sIndex.bagOfwords[term]
  return Math.log2(
    1 + (
      sIndex.documentNumber - numberOfDocumentsContainingTerm + 0.5
    ) / (
      numberOfDocumentsContainingTerm + 0.5
    )
  )
}

export function first() {
  // NLP Code.

  const text = `
 In the field of medicine, radiomics is a method that extracts a large number of features from medical images using data-characterisation algorithms.
 These features, termed radiomic features, have the potential to uncover tumoral patterns and characteristics that fail to be appreciated by the naked eye.
 The hypothesis of radiomics is that the distinctive imaging features between disease forms may be useful for predicting prognosis and therapeutic response for various cancer types, thus providing valuable information for personalized therapy.
 Radiomics emerged from the medical fields of radiology and oncology and is the most advanced in applications within these fields.
 However, the technique can be applied to any medical study where a pathological process can be imaged.
 Image acquisition.
 The image data is provided by radiological modalities as CT, MRI, PET/CT or even PET/MR.
 The produced raw data volumes are used to find different pixel/voxel characteristics through extraction tools.
 Image segmentation.
 Feature extraction and qualification.
 Prediction risk of distant metastasis.
 Assessment of cancer genetics.
 Image guided radiotherapy.
 Distinguishing true progression from radionecrosis.
 Prediction of physiological events.
 Multiparametric radiomics.
 The branches of science known informally as omics are various disciplines in biology whose names end in the suffix -omics, such as genomics, proteomics, metabolomics, metagenomics, phenomics and transcriptomics.
 Omics aims at the collective characterization and quantification of pools of biological molecules that translate into the structure, function, and dynamics of an organism or organisms.
 The Gentlemen follows American expat Mickey Pearson (Matthew McConaughey) who built a highly profitable marijuana empire in London.
  When word gets out that he's looking to cash out of the business forever it triggers plots, schemes, bribery and blackmail in an attempt to steal his domain out from under him.
  `

  const doc = nlp.readDoc(text)
  console.log('doc.out()', doc.out())
  console.log('doc.sentences().out()', doc.sentences().out())
  // -> [ 'Hello   World🌎!', 'How are you?' ]
  console.log('doc.entities().out(its.detail)', doc.entities().out(its.detail))
  console.log('doc.entities().out(its.type)', doc.entities().out(its.type))
  console.log('doc.entities().out(its.sentiment)', doc.entities().out(its.sentiment))
  // -> [ { value: '🌎', type: 'EMOJI' } ]
  console.log('doc.tokens().out()', doc.tokens().out())
  // -> [ 'Hello', 'World', '🌎', '!', 'How', 'are', 'you', '?' ]
  console.log('doc.tokens().out(its.type, as.freqTable)', doc.tokens().out(its.type, as.freqTable))

  //console.log( doc.tokens().out(its.stem) )
  //console.log( doc.tokens().out(its.detail) )
  console.log('lemma', doc.tokens().out(its.lemma))
  console.log('lemma + bigrams', doc.tokens().out(its.lemma, as.bigrams))
  console.log('lemma + freqTable', doc.tokens().out(its.lemma, as.freqTable))
  console.log('lemma + array', doc.tokens().out(its.lemma, as.array))
  console.log('lemma + bow', doc.tokens().out(its.lemma, as.bow))
  console.log('lemma + set', doc.tokens().out(its.lemma, as.set))
  console.log('lemma + unique', doc.tokens().out(its.lemma, as.unique))
  // console.log('its.abbrevFlag', doc.tokens().out(its.abbrevFlag) )
  // console.log('its.case', doc.tokens().out(its.case) )
  // console.log('its.uniqueId', doc.tokens().out(its.uniqueId) )
  // console.log('its.normal', doc.tokens().out(its.normal) )
  // console.log('its.negationFlag', doc.tokens().out(its.negationFlag) )
  // console.log('its.contractionFlag', doc.tokens().out(its.contractionFlag) )
  // console.log('its.precedingSpaces', doc.tokens().out(its.precedingSpaces) )
  // console.log('its.prefix', doc.tokens().out(its.prefix) )
  // console.log('its.suffix', doc.tokens().out(its.suffix) )
  // console.log('its.shape', doc.tokens().out(its.shape) )
  // console.log('its.type', doc.tokens().out(its.type) )
  // console.log('its.value', doc.tokens().out(its.value) )
  // console.log('its.vector', doc.tokens().out(its.vector) )
  // console.log('its.span', doc.tokens().out(its.span) )
  // console.log('its.sentiment', doc.tokens().out(its.sentiment) )
  // console.log('its.readabilityStats', doc.tokens().out(its.readabilityStats) )
  // console.log('its.idf', doc.tokens().out(its.idf) )
  const allTypes = doc.tokens().out(its.type)
  const allstopWordsFlags = doc.tokens().out(its.stopWordFlag)
  const lemmas = new Set(doc.tokens().out(its.lemma).filter((_w: string, index: number) => {
    const tp = allTypes[index]
    return !(tp === 'punctuation' || tp === 'tabCRLF') && !allstopWordsFlags[index]
  }))
  console.log('Lemmas', lemmas)
  //const kNgram = 2;
  //const ngramsTable: Record<string, number> = {}
  //for (let i = 0; i < lemmas.length - kNgram; ++i) {
  //  const key = lemmas.slice(i, i+kNgram).join(' ')
  //  if (!(key in ngramsTable)) {
  //    ngramsTable[key] = 0
  //  }
  //  ngramsTable[key] += 1
  //}
  const hotPos: Set<PartOfSpeech> = new Set(['NOUN', 'ADJ', 'PROPN'])
  doc.sentences().each(s => {
    const pos = s.tokens().out(its.pos) as PartOfSpeech[]
    console.log('sentences.pos', pos)

    const stopWordFlag = s.tokens().out(its.stopWordFlag)
    // console.log('sentences.stopWordFlag', stopWordFlag)

    const keywords = s.tokens().out().map((token: string, index: number) => {
      const p = pos[index]
      if (hotPos.has(p) && !stopWordFlag[index]) {
        return token
      }
      return null
    })
    console.log('Sentence:', s.out())
    console.log('Keywords:', keywords)
  })

  const texts = [
    `Schoonover used Vim as his editor inside of a terminal, so he had to be conscious of its color limitations and decided to limit the scheme to 16 colors.`,
    `He also worked on both a light and dark color scheme early on, with the goal of making them opposites of each other and cohesive.`,
    `Due to Schoonover's prior experience with photography and color management, Solarized was designed in the CIELAB color space, with sRGB hex values being generated from canonical CIELAB values.`,
    `Initially, Schoonover had a goal of creating a build system that would output themes for many different applications, but it proved difficult due to undocumented and complicated formats.`,
    `Solarized reduces brightness contrast but, unlike many low contrast colorschemes, retains contrasting hues (based on colorwheel relations) for syntax highlighting readability.`,
    `Schoonover first worked on Ruby and Haskell syntax highlighting to make sure their overall "typographic color" looked consistent.`,
    `Schoonover had trouble getting the shade of red correct.`,
    `The use of the colors yellow and blue were personal choices for Schoonover: yellow associated with "pleasant sounds, shapes, and pieces of music" due to minor synesthesia, and blue representing how he imagines drowning in the ocean to be like because of his thalassophobia.`,
    `Schoonover expressed concern that ports might use an uneven mix of colors or too many colors.`,
    `The Light and Dark schemes have symmetric CIELAB lightness differences in their base colors, preserving perceived contrast.`,
    `The 16-color palette was also designed to scale down to multiple five-color palettes for design work.`,
  ]
  let [searchIndex, documents] = createSearchIndex()
  for (const text of texts) {
    const [newIndex, docIndex] = addDocument(searchIndex, text)
    searchIndex = newIndex
    documents.push(docIndex)
  }
  console.log('Index & doc', searchIndex, documents)
}
