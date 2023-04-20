import * as tf from '@tensorflow/tfjs'
import * as use from '@tensorflow-models/universal-sentence-encoder'

import fs from 'fs'
import * as csv from '@fast-csv/parse'
import { log } from 'armoury'

type TsvRow = {
  lang: 'en'
  url: string
  text: string
  source: string
}

function euclideanDistance(a: tf.Tensor, b: tf.Tensor): number {
  const squaredDifference = tf.pow(tf.sub(a, b), 2)
  const sum = tf.sum(squaredDifference)
  return Math.sqrt(sum.dataSync()[0])
}

describe('data-driven test', () => {
  const rows: TsvRow[] = []
  let model: use.UniversalSentenceEncoder
  const embeddingsArray: tf.Tensor2D[] = []

  beforeAll(async (done) => {
    log.debug('Before all start', new Date())
    // Load the Universal Sentence Encoder model
    model = await use.load()
    log.debug('Before all model loaded', new Date())
    const csvStream = csv
      .parse({ headers: true, escape: '\\', delimiter: '\t' })
      .on('data', (row: TsvRow) => {
        rows.push(row)
      })
      .on('end', async () => {
        Promise.all(rows.map((row) => model.embed(row.text))).then((array) => {
          for (const item of array) {
            embeddingsArray.push(item)
          }
        })
        log.debug('All embeddings are calculated', new Date())
        done()
      })
    // read in the csv file contents
    const stream = fs.createReadStream(
      // `${__dirname}/test-data/dpedia.org-ontology-abstract.10000.tsv`
      `${__dirname}/test-data/dpedia.org-ontology-abstract.1000.tsv`
    )
    stream.pipe(csvStream)
  })
  it('', async () => {
    log.debug('Calculate embeddings for the test input', new Date())
    const text = 'Colour model: red, green and blue'
    const inputEmbedding = await model.embed(text)
    log.debug('Calculate embeddings for the test input -> done', new Date())
    const similarities = embeddingsArray.map((embedding) =>
      euclideanDistance(inputEmbedding, embedding)
    )
    log.debug('Search for similar entries -> done', new Date())
    // Find the index of the most similar text in the array
    // const mostSimilarIndex = similarities.indexOf(Math.min(...similarities))
    const mostSimilarIndex = similarities.indexOf(Math.min(...similarities))
    const mostSimilarText = rows[mostSimilarIndex]
    log.debug(
      'Similarities',
      new Date(),
      similarities[mostSimilarIndex],
      similarities
    )
    log.debug('MostSimilarText', new Date(), mostSimilarText)
  })
})
