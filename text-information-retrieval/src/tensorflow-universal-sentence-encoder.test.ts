import * as tf from '@tensorflow/tfjs-node-gpu'
import * as use from '@tensorflow-models/universal-sentence-encoder'

import fs from 'fs'
import * as csv from '@fast-csv/parse'

type TsvRow = {
  lang: 'en'
  url: string
  text: string
  source: string
}

function euclideanDistance(a: tf.Tensor, b: tf.Tensor): number {
  const squaredDifference = tf.pow(tf.sub(a, b), 2);
  const sum = tf.sum(squaredDifference);
  return Math.sqrt(sum.dataSync()[0]);
}

describe('data-driven test', () => {
  const rows: TsvRow[] = []
  let model: use.UniversalSentenceEncoder
  const embeddingsArray: tf.Tensor2D[] = []

  beforeAll(async (done) => {
    // Load the Universal Sentence Encoder model
    model = await use.load()
    const csvStream = csv
      .parse({ headers: true, escape: '\\', delimiter: '\t' })
      .on('data', (row: TsvRow) => {
        rows.push(row)
      })
      .on('end', async () => {
        Promise.all(
          rows.map((row) => model.embed(row.text))).then((array) => {
            for (const item of array) {
              embeddingsArray.push(item)
            }
            done()
          })
      })
    // read in the csv file contents
    const stream = fs.createReadStream(
      // `${__dirname}/test-data/dpedia.org-ontology-abstract.10000.tsv`
      `${__dirname}/test-data/dpedia.org-ontology-abstract.1000.tsv`
    )
    stream.pipe(csvStream)
  })
  it('', async () => {
    const text = 'Colour model: red, green and blue'

    // Compute the cosine similarity between the input text and each of the texts in the array
    const inputEmbedding = await model.embed(text)
    console.log('inputEmbedding', inputEmbedding)
    const similarities = embeddingsArray.map((embedding) => euclideanDistance(inputEmbedding, embedding))

    // Find the index of the most similar text in the array
    //const mostSimilarIndex = similarities.indexOf(Math.min(...similarities))
    const mostSimilarIndex = similarities.indexOf(Math.min(...similarities))
    const mostSimilarText = rows[mostSimilarIndex]
    console.log('Similarities', similarities[mostSimilarIndex], similarities)
    console.log('MostSimilarText', mostSimilarText)
})})
