import * as tf from '@tensorflow/tfjs-node-gpu'
import * as use from '@tensorflow-models/universal-sentence-encoder'

import { log } from 'armoury'

export type TfIndex = {
  algorithm: 'Tensorflow Embedding'
  // Keep version around in case we need to patch the implementation and
  // regenrate an index.
  version: 1
  encoder: use.UniversalSentenceEncoder
}

export type TfPerDocumentIndex<DocIdType> = {
  algorithm: 'Tensorflow Embedding'
  version: 1

  // Unique docId for a document
  docId: DocIdType

  embedding: tf.Tensor2D
}

export async function createIndex<DocIdType>(): Promise<
  [TfIndex, TfPerDocumentIndex<DocIdType>[]]
> {
  const encoder = await use.load()
  return [{ algorithm: 'Tensorflow Embedding', version: 1, encoder }, []]
}

export type TextScore = {
  total: number
}

export type RelevanceResult<DocIdType> = {
  docId: DocIdType
  score: number
}

function euclideanDistance(a: tf.Tensor, b: tf.Tensor): number {
  const squaredDifference = tf.pow(tf.sub(a, b), 2)
  const sum = tf.sum(squaredDifference)
  return Math.sqrt(sum.dataSync()[0])
}

export function findRelevantDocuments<DocIdType>(
  pattern: tf.Tensor2D,
  docs: TfPerDocumentIndex<DocIdType>[],
  scoreThreshold: number
): RelevanceResult<DocIdType>[] {
  const results: RelevanceResult<DocIdType>[] = []
  docs.forEach(({ docId, embedding }: TfPerDocumentIndex<DocIdType>) => {
    const score = euclideanDistance(pattern, embedding)
    log.debug('Score', score)
    if (score > scoreThreshold) {
      results.push({ score, docId })
    }
  })
  results.sort((ar, br) => br.score - ar.score)
  return results
}

export async function addDocument<DocIdType>(
  text: string,
  docId: DocIdType,
  tfIndex: TfIndex
): Promise<TfPerDocumentIndex<DocIdType>> {
  const embedding = await tfIndex.encoder.embed(text)
  return { algorithm: 'Tensorflow Embedding', version: 1, embedding, docId }
}
