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
    expect(relIndex.bagOfWords).not.toBeFalsy()
    expect(relIndex.documentsNumber).toStrictEqual(10000 + 1)
    // The following numbers depend on search algorithm, change them accordingly
    expect(relIndex.wordsInAllDocuments).toStrictEqual(2097115)
    expect(relIndex.bagOfWords.size).toStrictEqual(77679)
  })

  it('Christmas Coffeehouse', () => {
    const res = findRelevantDocumentsForPhrase(
      'Christmas Morning',
      8,
      relIndex,
      relIndexPerDocument
    )
    expect(res).toStrictEqual([])
    const nids = res.map((r) => r.docId)
    expect(nids).toStrictEqual([
      'http://dbpedia.org/resource/Father_Christmas',
      'http://dbpedia.org/resource/Christmas_tree',
      'http://dbpedia.org/resource/Christmas',
      'http://dbpedia.org/resource/Christmas_in_Poland',
    ])
  })
  it('Search for corpus texts in corpus itself', () => {
    const len = 100
    const start = Math.floor(Math.random() * (rows.length - len))
    rows.slice(start, start + len).forEach((row) => {
      const res = findRelevantDocuments(
        row.text,
        1,
        relIndex,
        relIndexPerDocument
      )
      expect(res.map(r => r.docId)).toStrictEqual([row.url])
    })
  })
  it('Search for text with JS keyword "constructor" as one of the terms', () => {
        const text = "In object-oriented programming, a class is an extensible program-code-template for creating objects, providing initial values for state (member variables) and implementations of behavior (member functions or methods). In many languages, the class name is used as the name for the class (the template itself), the name for the default constructor of the class (a subroutine that creates objects), and as the type of objects generated by instantiating the class; these distinct concepts are easily conflated. Although, to the point of conflation, one could argue that is a feature inherent in a language because of its polymorphic nature and why these languages are so powerful, dynamic and adaptable for use compared to languages without polymorphism present. Thus they can model dynamic systems (i.e. the real world, machine learning, AI) more easily.When an object is created by a constructor of the class, the resulting object is called an instance of the class, and the member variables specific to the object are called instance variables, to contrast with the class variables shared across the class.In some languages, classes are only a compile-time feature (new classes cannot be declared at run-time), while in other languages classes are first-class citizens, and are generally themselves objects (typically of type Class or similar). In these languages, a class that creates classes is called a metaclass"
      const res = findRelevantDocuments(
        text,
        1,
        relIndex,
        relIndexPerDocument
      )
      expect(res.map(r => r.docId)).toStrictEqual(['http://dbpedia.org/resource/Class_(computer_programming)'])
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
