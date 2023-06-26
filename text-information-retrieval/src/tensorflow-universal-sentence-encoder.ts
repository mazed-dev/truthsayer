import * as tf from '@tensorflow/tfjs'

import * as tfuse from '@tensorflow-models/universal-sentence-encoder'

import type { TfEmbeddingJson } from 'smuggler-api'
import { range } from 'armoury'
import lodash from 'lodash'

export type State = {
  encoder: tfuse.UniversalSentenceEncoder
}

export type TfInitialisationConfig = {
  // NOTE: model & vocab json files are not the only ones universal-sentence-encoder
  // will try to load, but paths to remaining files get determined implicitely,
  // inside tfjs code. See note on 'weightsManifest' in webpack.config.js for more
  // about the implicit files.
  modelUrl: string
  vocabUrl: string
}

export async function createState({
  modelUrl,
  vocabUrl,
}: TfInitialisationConfig): Promise<State> {
  const encoder = await tfuse.load({
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
  const sum = tf.tidy(() => {
    const squaredDifference = tf.pow(tf.sub(a, b), 2)
    return tf.sum(squaredDifference)
  })
  try {
    const data = await sum.data()
    return Math.sqrt(data[0])
  } finally {
    sum.dispose()
  }
}

export async function cosineDistance(
  a: tf.Tensor2D,
  b: tf.Tensor2D
): Promise<number> {
  const cosSimilarity = tf.tidy(() => {
    const aNorm = tf.norm(a)
    const bNorm = tf.norm(b)
    const dotProduct = tf.matMul(a, b, false, true)
    return dotProduct.div(aNorm.mul(bNorm))
  })
  try {
    const data = await cosSimilarity.data()
    const distance = 1 - data[0]
    return distance
  } finally {
    cosSimilarity.dispose()
  }
}

export async function tensor2dToJson(
  tensor: tf.Tensor2D
): Promise<TfEmbeddingJson> {
  const data = Array.from(await tensor.data())
  const shape = tensor.shape
  return { data, shape }
}

export function tensor2dFromJson({
  data,
  shape,
}: TfEmbeddingJson): tf.Tensor2D {
  return tf.tensor2d(data, shape)
}

export function sampleDimensions(
  inputVector: TfEmbeddingJson,
  targetSize: number
): number[] {
  return lodash.sampleSize(range(0, inputVector.shape[1]), targetSize)
}

export async function projectVector(
  inputVector: TfEmbeddingJson,
  dimensions: number[]
): Promise<TfEmbeddingJson> {
  // This is the "right" way to do a projection to a surface in the space of
  // smaller dimensions, but it's not the faastest one.
  // const projectionVector = tf.randomNormal([query.shape[1], smalerSpaceSize]);
  // return tf.dot(inputVector, projectionVector)
  //
  // So the simpler and much quicker way to have vector in a space of fewer
  // dimensions is to sample the coordinates of the original vector.
  const data = dimensions.map((index: number) => inputVector.data[index])
  return { data, shape: [1, data.length] }
}
