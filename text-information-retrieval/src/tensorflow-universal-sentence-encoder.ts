import * as tf from '@tensorflow/tfjs'
import * as use from '@tensorflow-models/universal-sentence-encoder'
import type { TfEmbeddingJson } from 'smuggler-api'

export type TfEmbeddingSignature = {
  algorithm: 'tf-embed'
  version: 1 // TensorFlow with universal sentense encoder
}
export type TfState = {
  signature: TfEmbeddingSignature
  encoder: use.UniversalSentenceEncoder
}

export function getExpectedSignature(): TfEmbeddingSignature {
  return { algorithm: 'tf-embed', version: 1 }
}

export function isPerDocIndexUpToDate(
  algorithm?: string,
  version?: number
): boolean {
  const expected = getExpectedSignature()
  return version === expected.version && algorithm === expected.algorithm
}

export async function createTfState(): Promise<TfState> {
  const encoder = await use.load()
  return { signature: getExpectedSignature(), encoder }
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

export function tensor2dFromJson({
  data,
  shape,
}: TfEmbeddingJson): tf.Tensor2D {
  return tf.tensor2d(data, shape)
}
