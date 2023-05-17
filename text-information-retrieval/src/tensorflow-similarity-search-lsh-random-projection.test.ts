import * as tf from '@tensorflow/tfjs-node'
import * as use from '@tensorflow-models/universal-sentence-encoder'
import '@tensorflow/tfjs-backend-cpu'

import { range, Timer, log } from 'armoury'

import { DPEDIA_RANDOM_100 } from './test-data/dpedia.org-ontology-abstract.100'

import {
  euclideanDistance,
  cosineDistance,
  projectVector,
  sampleDimensions,
} from './tensorflow-universal-sentence-encoder'
import lodash from 'lodash'

import { KNNClassifier } from '@tensorflow-models/knn-classifier'

async function knn(
  corpus: tf.Tensor2D[],
  query: tf.Tensor2D,
  k: number
): Promise<string[]> {
  // Create the classifier.
  const classifier = new KNNClassifier()

  for (let index = 0; index < corpus.length; ++index) {
    const value = corpus[index]
    classifier.addExample(value, index)
  }
  const result = await classifier.predictClass(query, k)
  return Object.entries(result.confidences)
    .filter(([_label, confidence]: [string, number]) => confidence > 0)
    .map(([label, _confidence]: [string, number]) => label)
}

// function findClosestIndex(sortedArray: number[], target: number): number {
//   let left = 0;
//   let right = sortedArray.length - 1;
//
//   while (left <= right) {
//     const mid = Math.floor((left + right) / 2);
//
//     if (sortedArray[mid] === target) {
//       return mid;
//     } else if (sortedArray[mid] < target) {
//       left = mid + 1;
//     } else {
//       right = mid - 1;
//     }
//   }
//
//   // If the target is less than the smallest element in the array, return the index of the first element
//   if (right < 0) {
//     return 0;
//   }
//
//   // If the target is greater than the largest element in the array, return the index of the last element
//   if (left >= sortedArray.length) {
//     return sortedArray.length - 1;
//   }
//
//   // Check which element (left or right) is closer to the target and return its index
//   return Math.abs(sortedArray[left] - target) < Math.abs(sortedArray[right] - target) ? left : right;
// }
//
// function projectVector(inputVector: tf.Tensor2D): tf.Tensor2D {
//   const dimensions = new Set<number>(
//     range(0, 26)
//   )
//   const data = inputVector.dataSync().filter((_value: number, index: number) => {
//     return dimensions.has(index)
//   })
//   return tf.tensor2d(data,[1,data.length])
// }
//
// function print2DArray(arr: number[][], title?:string, fixed?: number): void {
//   const horisontalPadding = arr.length.toString().length
//   const rows: string[] = [
//     ''.padStart(horisontalPadding + 3, ' ') +
//     range(0, arr[0].length).map((v) => v.toString().padStart((fixed ?? 2) + 2, ' ')).join(' ')
//   ]
//   const prettyPrintValue = !fixed ? (v: number) => v.toString() : (v: number) => v.toFixed(fixed)
//   for (let aInd = 0; aInd < arr.length; ++aInd) {
//     const row = arr[aInd]
//     rows.push(`${aInd.toString().padStart(horisontalPadding, ' ')} > ` + row.map(v => prettyPrintValue(v)).join(' '))
//   }
//   if (title) {
//     rows.unshift(title)
//   }
//   log.debug(rows.join('\n'))
// }
//
// function getTopProjDist(a: tf.Tensor2D, b: tf.Tensor2D): number[] {
//   const arrA = a.arraySync()[0]
//   const arrB = b.arraySync()[0]
//   let tops = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
//   for (let ind = 0; ind < arrA.length; ++ind) {
//     const diff = Math.abs(arrA[ind] - arrB[ind])
//     if (diff > tops[0]) {
//       tops.push(diff)
//       tops.sort((a, b) => b - a)
//       tops = tops.slice(0, 10)
//     }
//   }
//   return tops
// }
//
// test('', async () => {
//   const encoder = await use.load()
//   // const first = 'Both sentences describe the same event: a cat sitting on a mat. The only difference is the choice of words. Programming language.'
//   // const second = 'Our current approach is based on theory that reading and writing are parts of the same workflow.'
//   // const first = 'The cat rested on the mut.'
//   //const second = 'The feline rested on the rug.'
//   // const first = 'Insecure types are extremely risk averse and unproductive. Some can be downright nasty or display abusive behaviors.'
//   // const second = 'While feeling insecure is natural, problematic behaviors can develop when people consistently attempt to conceal or compensate for their self-doubt.'
//   // const first = "Unit testing framework with automatic test registration. Needs C++11 compiler support for the C++ API. Supports theories and parameterized tests. Each test is run in its own process, so signals and crashes can be reported. Can output to multiple formats, like the TAP format or JUnit XML. Supported on Linux, OS X, FreeBSD, and Windows."
//   // const second = "A robust header only unit testing framework for C and C++ programming language. Support function mocking, memory leak detection, crash report. Works on various platforms including embedded systems and compatible with various compilers. Outputs to multiple format like TAP, JunitXML, TAPV13 or plain text."
//   //
//   const recs = DPEDIA_RANDOM_100 // .slice(0, 41)
//
//   // const embeddings: Map<string, tf.Tensor2D> = new Map()
//   type EmbRec = {
//     url: string
//     embedding: tf.Tensor2D
//   }
//   const embeddings: EmbRec[] = []
//   for (const {url, text} of recs) {
//     const embedding = await encoder.embed(text)
//     embeddings.push({ url, embedding })
//   }
//   const cosineDist: number[][] = range(0, recs.length).map((_value) => range(0, recs.length).map(_value => 0))
//   const cosineProjDist: number[][] = range(0, recs.length).map((_value) => range(0, recs.length).map(_value => 0))
//   let mistakesCount = 0
//   let collisionsCount = 0
//   let maxProjDiffForMistake = 0
//   const mistakes: number[][] = range(0, recs.length).map((_value) => range(0, recs.length).map(_value => 0))
//   const collisions: number[][] = range(0, recs.length).map((_value) => range(0, recs.length).map(_value => 0))
//   // const euclideanDist: number[][] = range(0, recs.length).map((_value) => range(0, recs.length).map(_value => -1))
//   const maxProj: number[][] = range(0, recs.length).map(
//     (_value) => range(0, recs.length).map((_value) => 0)
//   )
//   let total = 0
//   const threshold = 0.18
//   for (let aInd = 0; aInd < embeddings.length; ++aInd) {
//     for (let bInd = 0; bInd <= aInd; ++bInd) {
//       total += aInd !== bInd ? 1 : 0
//       const aEmb = embeddings[aInd].embedding
//       const bEmb = embeddings[bInd].embedding
//       const cDist = Math.abs(cosineDistance(aEmb, bEmb))
//       // const cProjDist = Math.abs(cosineDistance(projectVector(aEmb), projectVector(bEmb)))
//       // const cDist = euclideanDistance(aEmb, bEmb)
//       const cProjDist = euclideanDistance(projectVector(aEmb), projectVector(bEmb))
//
//       cosineDist[aInd][bInd] = cDist
//       cosineProjDist[aInd][bInd] = cProjDist
//       maxProj[aInd][bInd] = getTopProjDist(aEmb, bEmb)[0]
//
//       const isMistake = (cProjDist > threshold) && (cDist < 0.25)
//       const isCollision = (cProjDist < threshold) && (cDist >= 0.25)
//       if (isMistake && cProjDist > maxProjDiffForMistake) {
//         maxProjDiffForMistake = cProjDist
//       }
//
//       mistakes[aInd][bInd] = isMistake ? 1.11 : 0
//       collisions[aInd][bInd] = isCollision ? 1.11 : 0
//       mistakesCount += isMistake ? 1 : 0
//       collisionsCount += isCollision ? 1 : 0
//     }
//   }
//   print2DArray(cosineDist, 'Cosine distances', 2)
//   print2DArray(cosineProjDist, 'Cosine proj distances', 2)
//   print2DArray(mistakes, 'Mistakes', 2)
//   print2DArray(collisions, 'Collisions', 2)
//   //print2DArray(euclideanDist, 'Euclidean distances')
//   print2DArray(maxProj, 'Top projection', 2)
//   log.debug(`Max proj dist for mistake`, maxProjDiffForMistake)
//   log.debug(`Collisions ${collisionsCount}/${total} ${collisionsCount / total}`)
//   log.debug(`Mistakes ${mistakesCount}/${total} ${mistakesCount / total}`)
//   // const firstEmbeding = await encoder.embed(first)
//   // const secondEmbeding = await encoder.embed(second)
//   // getProjections(firstEmbeding)
//   // getProjections(secondEmbeding)
//   // log.debug('euclideanDistance', euclideanDistance(firstEmbeding, secondEmbeding))
//   // log.debug('gance', cosineDistance(firstEmbeding, secondEmbeding))
//   // log.debug('Tops', getTopProjDist(firstEmbeding, secondEmbeding))
//   expect(false).toStrictEqual(true)
// })
//
// test('findClosestIndex', () => {
//   expect(findClosestIndex([1, 3, 5, 7, 9, 11, 13], 8)).toStrictEqual( 3)
//   expect(findClosestIndex([1, 3, 5, 7, 9], 28)).toStrictEqual(4)
//   expect(findClosestIndex([1, 3, 5, 7, 9], -8)).toStrictEqual(0)
// })
//
// test('knn', async () => {
//   const timer = new Timer()
//   const encoder = await use.load()
//   log.debug('ML model loaded', timer.elapsed()/1000)
//   const recs = DPEDIA_RANDOM_100.slice(0, 20)
//   const embeddings: tf.Tensor2D[] = []
//   for (const {text} of recs) {
//     const embedding = await encoder.embed(text)
//     embeddings.push(embedding)
//   }
//   log.debug('Embeddings calculated', timer.elapsed()/1000)
//   const cosineDist: number[][] = range(0, recs.length).map((_value) => range(0, recs.length).map(_value => 0))
//   for (let aInd = 0; aInd < embeddings.length; ++aInd) {
//     for (let bInd = 0; bInd <= aInd; ++bInd) {
//       const aEmb = embeddings[aInd]
//       const bEmb = embeddings[bInd]
//       const dist = Math.abs(cosineDistance(aEmb, bEmb))
//       cosineDist[aInd][bInd] = dist
//     }
//   }
//   log.debug('All-to-all cosine distances calculated', timer.elapsed()/1000)
//   print2DArray(cosineDist, 'Cosine distances', 2)
//   const query = embeddings[0]
//   await knn(embeddings, query)
//   log.debug('Similarity calculated', timer.elapsed()/1000)
// })

function searchKNearestVectors(
  targetVector: tf.Tensor2D,
  otherVectors: tf.Tensor2D[],
  k: number
): number[] {
  // Generate random projection vectors
  const projectionVector = tf.randomNormal([targetVector.shape[1], 45])
  log.debug('projectVector.shape', projectionVector.shape)
  // Project the target vector and other vectors onto the projection vectors
  const projectedTarget = tf.dot(targetVector, projectionVector)
  log.debug('projectTarget.shape', projectedTarget.shape)
  const projectedOthers = otherVectors.map((vec) =>
    tf.dot(vec, projectionVector)
  )
  // Calculate distances between the projected target and other vectors
  const distances = projectedOthers.map((vec, index) => ({
    distance: euclideanDistance(projectedTarget, vec),
    index,
  }))
  // Sort the distances in ascending order
  distances.sort((a, b) => a.distance - b.distance)
  // Retrieve the K nearest vectors
  const kNearestVectors = distances.slice(0, k).map((dist) => dist.index) // otherVectors[dist.index]);
  return kNearestVectors
}

function searchKNearestVectorsTrue(
  targetVector: tf.Tensor<tf.Rank>,
  otherVectors: tf.Tensor<tf.Rank>[],
  k: number
): number[] {
  // Calculate distances between the projected target and other vectors
  const distances = otherVectors.map((vec, index) => ({
    distance: euclideanDistance(targetVector, vec),
    index,
  }))
  // Sort the distances in ascending order
  distances.sort((a, b) => a.distance - b.distance)
  // Retrieve the K nearest vectors
  const kNearestVectors = distances.slice(0, k).map((dist) => dist.index) // otherVectors[dist.index]);
  return kNearestVectors
}

test.only('searchKNearestVectors - projection', async () => {
  jest.setTimeout(60000)
  const timer = new Timer()
  const encoder = await use.load()
  log.debug('ML model loaded', timer.elapsed() / 1000)
  const recs = DPEDIA_RANDOM_100 // .slice(0, 25)
  const embeddings: tf.Tensor2D[] = []
  for (const { text } of recs) {
    const embedding = await encoder.embed(text)
    embeddings.push(embedding)
  }
  log.debug('Embeddings created', timer.elapsed() / 1000)
  const query = embeddings[0]
  const smalerSpaceSize = 51
  const k = 15

  const dimensions = sampleDimensions(query, smalerSpaceSize)

  // Project the target vector and other vectors onto the projection vectors
  const projectedQuery = projectVector(query, dimensions)
  const projectedEmbeddings = embeddings.map((vec) =>
    projectVector(vec, dimensions)
  )
  log.debug('Projections caculated', timer.elapsed() / 1000)

  const approxNearest = searchKNearestVectorsTrue(
    projectedQuery,
    projectedEmbeddings,
    k
  )
  log.debug('Approx Nearest caculated', timer.elapsed() / 1000, approxNearest)

  const knnApproxNearest = await knn(projectedEmbeddings, projectedQuery, k)
  log.debug(
    'Approx Nearest KNN caculated',
    timer.elapsed() / 1000,
    knnApproxNearest
  )

  const nearest = searchKNearestVectorsTrue(query, embeddings, k)
  log.debug('Nearest caculated', timer.elapsed() / 1000, nearest)
})
