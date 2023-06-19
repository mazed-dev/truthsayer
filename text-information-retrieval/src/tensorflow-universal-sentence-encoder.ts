import * as tf from '@tensorflow/tfjs'
import { tensor } from '@tensorflow/tfjs'
import type { Tensor, Tensor2D } from '@tensorflow/tfjs'

import * as use from '@tensorflow-models/universal-sentence-encoder'

import type { TfEmbeddingJson } from 'smuggler-api'
import { range } from 'armoury'
import lodash from 'lodash'

export { KNNClassifier } from '@tensorflow-models/knn-classifier'

export { tensor }
export type { Tensor, Tensor2D }

export type TfState = {
  encoder: use.UniversalSentenceEncoder
}

export type TfInitialisationConfig = {
  // NOTE: model & vocab json files are not the only ones universal-sentence-encoder
  // will try to load, but paths to remaining files get determined implicitely,
  // inside tfjs code. See note on 'weightsManifest' in webpack.config.js for more
  // about the implicit files.
  modelUrl: string
  vocabUrl: string
}

export async function createTfState({
  modelUrl,
  vocabUrl,
}: TfInitialisationConfig): Promise<TfState> {
  const encoder = await use.load({
    modelUrl,
    vocabUrl,
  })
  return { encoder }
}

export type RelevanceResult<DocIdType> = {
  docId: DocIdType
  score: number
}

export async function euclideanDistance(
  a: tf.Tensor,
  b: tf.Tensor
): Promise<number> {
  const squaredDifference = tf.pow(tf.sub(a, b), 2)
  const sum = tf.sum(squaredDifference)
  const data = await sum.data()
  return Math.sqrt(data[0])
}

export async function cosineDistance(
  a: Tensor2D,
  b: Tensor2D
): Promise<number> {
  const aNorm = tf.norm(a)
  const bNorm = tf.norm(b)
  const dotProduct = tf.matMul(a, b, false, true)
  const cosSimilarity = dotProduct.div(aNorm.mul(bNorm))
  const data = await cosSimilarity.data()
  const distance = 1 - data[0]
  return distance
}

export async function tensor2dToJson(
  tensor: Tensor2D
): Promise<TfEmbeddingJson> {
  const data = Array.from(await tensor.data())
  const shape = tensor.shape
  return { data, shape }
}

export function tensor2dFromJson({ data, shape }: TfEmbeddingJson): Tensor2D {
  return tf.tensor2d(data, shape)
}

export function sampleDimensions(
  inputVector: tf.Tensor2D,
  targetSize: number
): number[] {
  return lodash.sampleSize(range(0, inputVector.shape[1]), targetSize)
}

export async function projectVector(
  inputVector: tf.Tensor2D,
  dimensions: number[]
): Promise<tf.Tensor2D> {
  // This is the "right" way to do a projection to a surface in the space of
  // smaller dimensions, but it's not the faastest one.
  // const projectionVector = tf.randomNormal([query.shape[1], smalerSpaceSize]);
  // return tf.dot(inputVector, projectionVector)
  //
  // So the simpler and much quicker way to have vector in a space of fewer
  // dimensions is to sample the coordinates of the original vector.
  const dataSync = await inputVector.data()
  const data = dimensions.map((index: number) => dataSync[index])
  return tf.tensor2d(data, [1, data.length])
}
