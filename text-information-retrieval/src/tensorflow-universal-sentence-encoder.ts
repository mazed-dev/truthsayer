import * as tf from '@tensorflow/tfjs'
import * as use from '@tensorflow-models/universal-sentence-encoder'
import { TfEmbeddingJson } from 'smuggler-api'

export type TfState = {
  algorithm: 'tf-embed'
  version: 1 // TensorFlow with universal sentense encoder
  encoder: use.UniversalSentenceEncoder
}

export type TfPerDocumentIndex = {
  algorithm: 'Tensorflow Embedding'
  version: 1
  embedding: tf.Tensor2D
}

export function getAlgorithm(): 'tf-embed' {
  return 'tf-embed'
}
export function getVersion(): 1 {
  return 1
}

export function isPerDocIndexUpToDate(
  algorithm?: string,
  version?: number
): boolean {
  return version === getVersion() && algorithm === getAlgorithm()
}

export async function createTfState(): Promise<TfState> {
  const encoder = await use.load()
  return { algorithm: getAlgorithm(), version: getVersion(), encoder }
}

export type RelevanceResult<DocIdType> = {
  docId: DocIdType
  score: number
}

export function euclideanDistance(a: tf.Tensor, b: tf.Tensor): number {
  const squaredDifference = tf.pow(tf.sub(a, b), 2)
  const sum = tf.sum(squaredDifference)
  return Math.sqrt(sum.dataSync()[0])
}

export function cosineDistance(a: tf.Tensor2D, b: tf.Tensor2D): number {
  const aNorm = tf.norm(a)
  const bNorm = tf.norm(b)
  const dotProduct = tf.matMul(a, b, false, true)
  const cosSimilarity = dotProduct.div(aNorm.mul(bNorm))
  const distance = 1 - cosSimilarity.dataSync()[0]
  return distance
}

export function tensor2dToJson(tensor: tf.Tensor2D): TfEmbeddingJson {
  const data = Array.from(tensor.dataSync())
  const shape = tensor.shape
  return { data, shape }
}

export function tensor2dFromJson(json: string): tf.Tensor2D {
  const { data, shape } = JSON.parse(json)
  return tf.tensor2d(data, shape)
}

// export function findRelevantDocuments<DocIdType>(
//   pattern: tf.Tensor2D,
//   docs: TfPerDocumentIndex[],
//   scoreThreshold: number
// ): RelevanceResult<DocIdType>[] {
//   const results: RelevanceResult<DocIdType>[] = []
//   docs.forEach(({ docId, embedding }: TfPerDocumentIndex) => {
//     const score = euclideanDistance(pattern, embedding)
//     log.debug('Score', score, docId)
//     if (score < scoreThreshold) {
//       results.push({ score, docId })
//     }
//   })
//   results.sort((ar, br) => ar.score - br.score)
//   log.debug('Results', results)
//   return results
// }
//
// export async function addDocument<DocIdType>(
//   text: string,
//   docId: DocIdType,
//   tfIndex: TfIndex
// ): Promise<TfPerDocumentIndex<DocIdType>> {
//   const embedding = await tfIndex.encoder.embed(text)
//   return { algorithm: 'Tensorflow Embedding', version: 1, embedding, docId }
// }
