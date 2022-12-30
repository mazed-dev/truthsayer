import {
  createSearchIndex,
  addDocument,
  searchForPhrase,
  extractSearchKeyphrases,
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
    expect(searchIndex.wordsInAllDocuments).toStrictEqual(1191300)
    expect(Object.keys(searchIndex.bagOfwords).length).toStrictEqual(77451)
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

  it('Extract search keyphrase - phrase per sentence', () => {
    expect(
      extractSearchKeyphrases('This parameter holds the collection to iterate over')
        .length
    ).toStrictEqual(1)
    expect(
      extractSearchKeyphrases(
        'This parameter holds the collection to iterate over. This parameter holds the function invoked per iteration'
      ).length
    ).toStrictEqual(2)
    expect(
      extractSearchKeyphrases(`
    Lodash is a JavaScript library that works on the top of underscore.
    Lodash helps in working with arrays, collection, strings, objects, numbers etc.
    The filter() method iterates over elements of collection, returning an array of all elements predicate returns true.`)
        .length
    ).toStrictEqual(3)
  })
  it('Extract search keyphrase', () => {
    expect(
      extractSearchKeyphrases('This parameter holds the collection to iterate over')
    ).toStrictEqual(['parameter holds collection iterate'])
    expect(extractSearchKeyphrases('Image segmentation')).toStrictEqual([
      'Image segmentation',
    ])
    expect(
      extractSearchKeyphrases('Prediction of physiological events.')
    ).toStrictEqual(['Prediction physiological events'])
    expect(
      extractSearchKeyphrases(`
    Lodash is a JavaScript library that works on the top of underscore.
    Lodash helps in working with arrays, collection, strings, objects, numbers etc.
    `)
    ).toStrictEqual([
      'Lodash JavaScript library works underscore',
      'Lodash helps working arrays collection strings objects numbers',
    ])
  })
  it('Extract search keyphrases and search for them', () => {
    // This is rather sily test, we extract keyphrases from each document in
    // corpus and search for it, making sure exact document is discovered
    rows.slice(10).forEach((row) => {
      extractSearchKeyphrases(row.text).forEach((phrase) => {
        console.log('Phrase', phrase, row.url)
        const res = searchForPhrase(
          phrase,
          15,
          searchIndex,
          searchIndexPerDocument
        )
        expect(res).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              doc: expect.objectContaining({ nid: row.url }),
            }),
          ])
        )
      })
    })
  })
})
