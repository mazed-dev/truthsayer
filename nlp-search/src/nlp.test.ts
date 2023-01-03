import {
  createSearchIndex,
  addDocument,
  searchForPhrase,
  extractSearchKeyphrases,
  searchForSimilarDocuments,
} from './nlp'
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
  let [searchIndex, searchIndexPerDocument] = createSearchIndex()

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
        // done reading the file; we can call done() to tell Sencha Test to continue with specs
        // let [searchIndex, searchIndexPerDocument] = createSearchIndex()
        rows.forEach((row: TsvRow) => {
          const [newIndex, docIndex] = addDocument(
            searchIndex,
            row.text,
            row.url
          )
          searchIndex = newIndex
          searchIndexPerDocument.push(docIndex)
        })
        {
          const [newIndex, docIndex] = addDocument(
            searchIndex,
            '',
            'http://empty'
          )
          searchIndex = newIndex
          searchIndexPerDocument.push(docIndex)
        }
        done()
      })
    stream.pipe(csvStream)
  })

  afterAll(() => {
    rows = []
  })

  it('Search index is valid', () => {
    expect(searchIndex.bagOfwords).not.toBeFalsy()
    expect(searchIndex.documentsNumber).toStrictEqual(10000 + 1)
    // The following numbers depend on search algorithm, change them accordingly
    expect(searchIndex.wordsInAllDocuments).toStrictEqual(2097115)
    expect(Object.keys(searchIndex.bagOfwords).length).toStrictEqual(77678)
  })

  it('Christmas Coffeehouse', () => {
    const res = searchForPhrase(
      'Christmas Morning',
      4,
      searchIndex,
      searchIndexPerDocument
    )
    const nids = res.map((r) => r.doc.nid)
    expect(nids).toStrictEqual([
      'http://dbpedia.org/resource/Christmas_in_Poland',
      'http://dbpedia.org/resource/Christmas',
      'http://dbpedia.org/resource/Christmas_tree',
      'http://dbpedia.org/resource/Father_Christmas',
    ])
  })
  it('Search for corpus texts in corpus itself', () => {
    rows.slice(1, 100).forEach((row) => {
      const res = searchForSimilarDocuments(
        row.text,
        1,
        searchIndex,
        searchIndexPerDocument
      )
      expect(res[0].doc.nid).toStrictEqual(row.url)
    })
  })
})
