import {
  createIndex,
  addDocument,
  findRelevantDocumentsForPhrase,
  findRelevantDocuments,
  json,
} from './bm25'
import fs from 'fs'
import * as csv from '@fast-csv/parse'

type TsvRow = {
  lang: 'en'
  url: string
  text: string
  source: string
}
describe('data-driven test', () => {
  let rows: TsvRow[] = []
  let [relIndex, relIndexPerDocument] = createIndex()

  // we'll create an asynchronous beforeAll() method to read in our data
  beforeAll((done) => {
    rows = []
    // read in the csv file contents
    const stream = fs.createReadStream(
      `${__dirname}/test-data/dpedia.org-ontology-abstract.10000.tsv`
    )
    // use fast-csv; this particular file has headers, so let it know about it
    const csvStream = csv
      .parse({ headers: true, escape: '\\', delimiter: '\t' })
      .on('data', (data: TsvRow) => {
        // console.log( data)
        rows.push(data)
      })
      .on('end', () => {
        rows.forEach((row: TsvRow) => {
          const [newIndex, docIndex] = addDocument(relIndex, row.text, row.url)
          relIndex = newIndex
          relIndexPerDocument.push(docIndex)
        })
        {
          const [newIndex, docIndex] = addDocument(relIndex, '', 'http://empty')
          relIndex = newIndex
          relIndexPerDocument.push(docIndex)
        }
        done()
      })
    stream.pipe(csvStream)
  })

  afterAll(() => {
    rows = []
  })

  it('Search index is valid', () => {
    expect(relIndex.bagOfwords).not.toBeFalsy()
    expect(relIndex.documentsNumber).toStrictEqual(10000 + 1)
    // The following numbers depend on search algorithm, change them accordingly
    expect(relIndex.wordsInAllDocuments).toStrictEqual(2097115)
    expect(Object.keys(relIndex.bagOfwords).length).toStrictEqual(77678)
  })

  it('Christmas Coffeehouse', () => {
    const res = findRelevantDocumentsForPhrase(
      'Christmas Morning',
      4,
      relIndex,
      relIndexPerDocument
    )
    const nids = res.map((r) => r.docId)
    expect(nids).toStrictEqual([
      'http://dbpedia.org/resource/Father_Christmas',
      'http://dbpedia.org/resource/Christmas_tree',
      'http://dbpedia.org/resource/Christmas',
      'http://dbpedia.org/resource/Christmas_in_Poland',
    ])
  })
  it('Search for corpus texts in corpus itself', () => {
    rows.slice(1, 10).forEach((row) => {
      const res = findRelevantDocuments(
        row.text,
        1,
        relIndex,
        relIndexPerDocument
      )
      expect(res[0].docId).toStrictEqual(row.url)
    })
  })
  it('RelevanceIndex JSON (de)seriliasation', () => {
    const buf = json.stringifyIndex(relIndex)
    expect(buf.length).toBeGreaterThan(80_0000)
    const obj = json.parseIndex(buf)
    expect(obj.algorithm).toStrictEqual(relIndex.algorithm)
    expect(obj.model).toBeTruthy()
    expect(obj.documentsNumber).toStrictEqual(relIndex.documentsNumber)
    expect(obj.version).toStrictEqual(relIndex.version)
    expect(obj.wordsInAllDocuments).toStrictEqual(relIndex.wordsInAllDocuments)
  })
  it('RelevancePerDocumentIndex JSON (de)seriliasation', () => {
    const doc = relIndexPerDocument[0]
    const buf = json.stringifyPerDocumentIndex(doc)
    expect(buf.length).toBeGreaterThan(1000)
    const obj = json.parsePerDocumentIndex(buf)
    expect(obj.algorithm).toStrictEqual(doc.algorithm)
    expect(obj.docId).toStrictEqual(doc.docId)
    expect(obj.version).toStrictEqual(doc.version)
    expect(obj.wordsNumber).toStrictEqual(doc.wordsNumber)
  })
})
