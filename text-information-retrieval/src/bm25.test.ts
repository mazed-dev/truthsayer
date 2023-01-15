import {
  createIndex,
  addDocument,
  findRelevantDocumentsForPhrase,
  findRelevantDocuments,
  json,
  getTermInDocumentImportance,
  getTermInverseDocumentFrequency,
} from './bm25'
import fs from 'fs'
import * as csv from '@fast-csv/parse'

type TsvRow = {
  lang: 'en'
  url: string
  text: string
  source: string
}

// Key is more than just a string intentionally, to make sure code works with
// complex keys
type DocIdType = {
  url: string
}

describe('data-driven test', () => {
  let rows: TsvRow[] = []
  const [overallIndex, relIndexPerDocument] = createIndex<DocIdType>()

  beforeAll((done) => {
    rows = []
    const csvStream = csv
      .parse({ headers: true, escape: '\\', delimiter: '\t' })
      .on('data', (row: TsvRow) => {
        rows.push(row)
      })
      .on('end', () => {
        for (const row of rows) {
          const docIndex = addDocument(overallIndex, row.text, {
            url: row.url,
          })
          relIndexPerDocument.push(docIndex)
        }
        {
          // Add empty document
          const docIndex = addDocument(overallIndex, '', {
            url: 'http://empty',
          })
          relIndexPerDocument.push(docIndex)
        }
        {
          // Add a special doc to test docs & queries with JS keywords
          const docIndex = addDocument(
            overallIndex,
            `A class constructor is a special member function of a class that is
            executed whenever we create new objects of that class. A constructor
            will have exact same name as the class and it does not have any
            return type at all, not even void.`,
            {
              url: 'http://class.constructor.com',
            }
          )
          relIndexPerDocument.push(docIndex)
        }
        done()
      })
    // read in the csv file contents
    const stream = fs.createReadStream(
      // `${__dirname}/test-data/dpedia.org-ontology-abstract.10000.tsv`
      `${__dirname}/test-data/dpedia.org-ontology-abstract.1000.tsv`
    )
    stream.pipe(csvStream)
  })

  afterAll(() => {
    rows = []
  })

  it('Search index is valid', () => {
    expect(overallIndex.bagOfWords).not.toBeFalsy()
    expect(overallIndex.documentsNumber).toStrictEqual(1000 + 2)
    // The following numbers depend on search algorithm, change them accordingly
    expect(overallIndex.wordsInAllDocuments).toStrictEqual(
      119313
    )
    expect(overallIndex.bagOfWords.size).toStrictEqual(19393)
  })

  it('Term in a document importance calculation', () => {
    expect(getTermInDocumentImportance(49, 200, 1000)).toBeCloseTo(2.36)
    // Given word does not occure in the doc → 0
    expect(getTermInDocumentImportance(0, 200, 1000)).toStrictEqual(0)
    // Smaller doc is more Important
    expect(getTermInDocumentImportance(1, 200, 1000)).toBeGreaterThan(
      getTermInDocumentImportance(1, 300, 1000)
    )
  })

  it('Term inverse document frequency - IDF', () => {
    expect(getTermInverseDocumentFrequency(49, 999)).toBeCloseTo(3.005)
    // Frequent words are less important, than more infrequent
    expect(getTermInverseDocumentFrequency(10, 999)).toBeLessThan(
      getTermInverseDocumentFrequency(1, 999)
    )
    // Frequent words are not important, IDF → 0
    expect(getTermInverseDocumentFrequency(599, 999)).toStrictEqual(0)
  })

  it('Simple search for phrase', () => {
    const res = findRelevantDocumentsForPhrase<DocIdType>(
      'The RGB color model',
      1,
      overallIndex,
      relIndexPerDocument
    )
    const nids = res.map((r) => r.docId.url)
    expect(nids).toStrictEqual(['http://dbpedia.org/resource/RGB_color_model'])
  })

  it('Search for corpus texts in corpus itself', () => {
    const len = 2 // Select random documents and search for them in the corpus
    const start = Math.floor(Math.random() * (rows.length - len))
    rows.slice(start, start + len).forEach((row) => {
      const res = findRelevantDocuments(
        row.text,
        1,
        overallIndex,
        relIndexPerDocument
      )
      expect(res.map((r) => r.docId.url)).toStrictEqual([row.url])
    })
  })

  it('Search for text with JS keyword "constructor" as one of the terms', () => {
    const text =
      'A class constructor is a special member function of a class that is'
    const res = findRelevantDocuments(
      text,
      1,
      overallIndex,
      relIndexPerDocument
    )
    expect(res.map((r) => r.docId.url)).toStrictEqual([
      'http://class.constructor.com',
    ])
  })

  it('RelevanceIndex JSON (de)seriliasation', () => {
    const buf = json.stringifyIndex(overallIndex)
    expect(buf.length).toBeGreaterThan(27_0000)
    const obj = json.parseIndex(buf)
    expect(obj.algorithm).toStrictEqual(overallIndex.algorithm)
    expect(obj.model).toBeTruthy()
    expect(obj.documentsNumber).toStrictEqual(overallIndex.documentsNumber)
    expect(obj.version).toStrictEqual(overallIndex.version)
    expect(obj.wordsInAllDocuments).toStrictEqual(
      overallIndex.wordsInAllDocuments
    )
  })

  it('RelevancePerDocumentIndex JSON (de)seriliasation', () => {
    const doc = relIndexPerDocument[0]
    const buf = json.stringifyPerDocumentIndex(doc)
    expect(buf.length).toBeGreaterThan(1000)
    const obj = json.parsePerDocumentIndex<DocIdType>(buf)
    expect(obj.algorithm).toStrictEqual(doc.algorithm)
    expect(obj.docId.url).toStrictEqual(doc.docId.url)
    expect(obj.version).toStrictEqual(doc.version)
    expect(obj.wordsNumber).toStrictEqual(doc.wordsNumber)
  })
})
