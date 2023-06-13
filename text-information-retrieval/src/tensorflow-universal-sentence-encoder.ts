import * as tf from '@tensorflow/tfjs'
import { tensor } from '@tensorflow/tfjs'
import type { Tensor, Tensor2D } from '@tensorflow/tfjs'

import * as use from '@tensorflow-models/universal-sentence-encoder'

import type { TfEmbeddingJson } from 'smuggler-api'
import { range } from 'armoury'
import lodash from 'lodash'
import browser from 'webextension-polyfill'

export { KNNClassifier } from '@tensorflow-models/knn-classifier'

export { tensor }
export type { Tensor, Tensor2D }

export type TfState = {
  encoder: use.UniversalSentenceEncoder
}

export async function createTfState(): Promise<TfState> {
  // NOTE: model & vocab json files are not the only ones universal-sentence-encoder
  // will try to load, but paths to remaining files get determined implicitely,
  // inside tfjs code. See note on 'weightsManifest' in webpack.config.js for more
  // about the implicit files.
  const modelFilePath = browser.runtime.getURL('models/use-model.json')
  const vocabFilePath = browser.runtime.getURL('models/use-vocab.json')

  const encoder = await use.load({
    modelUrl: modelFilePath,
    vocabUrl: vocabFilePath,
  })
  return { encoder }
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

export function cosineDistance(a: Tensor2D, b: Tensor2D): number {
  const aNorm = tf.norm(a)
  const bNorm = tf.norm(b)
  const dotProduct = tf.matMul(a, b, false, true)
  const cosSimilarity = dotProduct.div(aNorm.mul(bNorm))
  const distance = 1 - cosSimilarity.dataSync()[0]
  return distance
}

export function tensor2dToJson(tensor: Tensor2D): TfEmbeddingJson {
  const data = Array.from(tensor.dataSync())
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

export function projectVector(
  inputVector: tf.Tensor2D,
  dimensions: number[]
): tf.Tensor2D {
  // This is the "right" way to do a projection to a surface in the space of
  // smaller dimensions, but it's not the faastest one.
  // const projectionVector = tf.randomNormal([query.shape[1], smalerSpaceSize]);
  // return tf.dot(inputVector, projectionVector)
  //
  // So the simpler and much quicker way to have vector in a space of fewer
  // dimensions is to sample the coordinates of the original vector.
  const dataSync = inputVector.dataSync()
  const data = dimensions.map((index: number) => dataSync[index])
  return tf.tensor2d(data, [1, data.length])
}
