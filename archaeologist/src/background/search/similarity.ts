import lodash from 'lodash'
import browser from 'webextension-polyfill'
import { tf, use, wink } from 'text-information-retrieval'
import {
  Nid,
  NodeBlockKey,
  NodeBlockKeyStr,
  NodeEventListener,
  NodeEventPatch,
  NodeEventType,
  NodeSimilaritySearchInfoLatest,
  StorageApi,
  TNode,
  TextContentBlock,
  TfEmbeddingJson,
  NodeSimilaritySearchSignatureLatest,
} from 'smuggler-api'
import {
  verifySimilaritySearchInfoVersion,
  nodeBlockKeyToString,
  nodeBlockKeyFromString,
  createNodeSimilaritySearchInfoLatest,
} from 'smuggler-api'
import { TDoc, Beagle } from 'elementary'
import CancellationToken from 'cancellationtoken'
import { Mutex } from 'async-mutex'
import { log, errorise, AbortError, Timer } from 'armoury'
import { backgroundpa, BackgroundPosthog } from '../productanalytics'
import { CachedKnnClassifier } from './cachedKnnClassifier'
import { AsyncKnnClassifier } from './asyncKnnClassifier'

// NOTE (label: 'conflicting-tensor2d-versions'):
// Some locations in this file and others interact with different tfjs-related
// packages, for example
//    - '@tensorflow-models/knn-classifier'
//    - '@tensorflow-models/universal-sentence-encoder'
// They all tend to depend on '@tensorflow/tfjs' which contains the "core" of tfjs.
// At the time of this writing they tend to use very different versions of the core
// package though and when results of one package are passed to another, it can
// result in errors like:
//    Type 'import("@tensorflow/tfjs-core/dist/tensor").Tensor2D' is
//    not assignable to type 'import("@tensorflow/tfjs-core/dist/tensor").Tensor2D'.
//    Two different types with this name exist, but they are unrelated.
//
// At the time of writing, latest versions of packages in question:
//    '@tensorflow-models/knn-classifier' uses '@tensorflow/tfjs-core' version 3.0.0
//    '@tensorflow-models/universal-sentence-encoder' uses '@tensorflow/tfjs-core' version 3.6.0
// while the rest of the code tries to use '@tensorflow/tfjs-core' 4.7.0
//
// Types are structuraly identical in all the versions, so there seems to be
// no harm in suppressing the errors. A more robust solution would be welcome
// though.
//
// END OF NOTE (label: 'conflicting-tensor2d-versions')

const wink_ = wink.loadModel()

type State = {
  useState: use.State
  fastIndex: FastIndex
}

let _state: State | null = null
const _stateInitMutex = new Mutex()

async function getState(
  storage: StorageApi,
  analytics: BackgroundPosthog | null
): Promise<State> {
  return await _stateInitMutex.runExclusive(async () => {
    if (_state != null) {
      return _state
    }
    const useState = await createUseState(analytics)
    const fastIndex = await createFastIndex(storage, analytics)
    _state = { useState, fastIndex }
    return _state
  })
}

const kNumberOfQuotesPerNodeLimit: number = 1

async function createUseState(
  analytics: BackgroundPosthog | null
): Promise<use.State> {
  const timer = new Timer()
  const ret = await use.createState({
    modelUrl: browser.runtime.getURL('models/use-model.json'),
    vocabUrl: browser.runtime.getURL('models/use-vocab.json'),
  })
  backgroundpa.performance(
    analytics,
    { action: 'similarity: ML model initial load' },
    timer,
    { andLog: true }
  )
  return ret
}

/**
 * To speed up similarity search we use KNN search to make search faster
 * than O(n). The method give approximate result of constant size ~100, which we
 * are clarifying later on with full Euclidean distance calculation between
 * pattern and vectors in approx results.
 *
 * To reduce memory footprint we use random projections method out of a theory
 * that if 2 points of multidimensional space lays far from each other on
 * projection, then the they are distanced from each other in reality too.
 * We use 512 → 48 reduction.
 *
 * Field `dimensions` is a randomly selected list of dimensions used to make
 * projections with `tf.projectVector`. Field itself is generated by special
 * method `tf.sampleDimensions`.
 *
 * Field `knn` is a KNN classifier to perform faster than liner approximate
 * search of K nearest neighboars.
 */
type FastIndex = {
  dimensions: number[]
  knn: CachedKnnClassifier
}

// See comment for `FastIndex`
const kProjectionDimensions = [
  6, 10, 24, 46, 50, 53, 56, 60, 65, 85, 136, 139, 140, 142, 147, 183, 189, 190,
  198, 212, 221, 229, 233, 247, 259, 281, 285, 288, 291, 310, 312, 313, 318,
  325, 329, 332, 346, 353, 381, 389, 390, 412, 417, 451, 469, 472, 481, 491,
]

type FastProjectionKey = {
  nid: Nid
  blockKeyStr: string
}

function serializeFastProjectionKey({
  nid,
  blockKeyStr,
}: FastProjectionKey): string {
  return `${nid}/${blockKeyStr}`
}
function deserializeFastProjectionKey(keyStr: string): FastProjectionKey {
  const ind = keyStr.indexOf('/')
  return { nid: keyStr.slice(0, ind), blockKeyStr: keyStr.slice(ind + 1) }
}

async function createFastIndex(
  storage: StorageApi,
  analytics: BackgroundPosthog | null
): Promise<FastIndex> {
  const timer = new Timer()
  // TODO[snikitin@outlook.com] Is it a problem that `dimensions` may differ
  // between what was used for projections stored in the cache vs what
  // got generated on a particular time getFastIndex() got called?
  // TODO[Alexander]: It's a problem, dimensions of all vectors are meant to be
  // excactly the same. To hot fix it right now, I use a fixed vectors of
  // dimensions, but some time later we'd need to select them randomly for every
  // user with `use.sampleDimensions` function.
  const dimensions = kProjectionDimensions
  const knn = await CachedKnnClassifier.create(
    browser.storage.local,
    NodeSimilaritySearchSignatureLatest
  )
  const allNids = await storage.node.getAllNids({})
  for (const nid of allNids) {
    const nodeSimSearchInfo = verifySimilaritySearchInfoVersion(
      await storage.node.similarity.getIndex({ nid })
    )
    if (nodeSimSearchInfo == null) {
      // Skip nodes with invalid index
      log.warning(`Similarity index for node ${nid} is outdated`)
      continue
    }
    const forBlocks = nodeSimSearchInfo.forBlocks
    const cachedClasses = knn.getClassifierDataset()
    for (const [blockKeyStr, embeddingJson] of Object.entries(forBlocks)) {
      const label = serializeFastProjectionKey({ nid, blockKeyStr })
      if (label in cachedClasses) {
        continue
      }
      let projection: tf.Tensor2D | null = null
      try {
        const projectionJson = await use.projectVector(
          embeddingJson,
          dimensions
        )
        projection = use.tensor2dFromJson(projectionJson)
        await knn.addExample(projection, label)
      } catch (err) {
        log.warning(
          `Adding example to KNN failed for label ${label}, error: ${
            errorise(err).message
          }`
        )
      } finally {
        projection?.dispose()
      }
    }
  }
  backgroundpa.performance(
    analytics,
    { action: 'similarity: create fast simsearch index' },
    timer,
    { andLog: true }
  )
  return { dimensions, knn }
}

async function updateNodeFastIndex(
  fastIndex: FastIndex,
  nid: Nid,
  nodeSimSearchInfo: NodeSimilaritySearchInfoLatest,
  updateType: 'created' | 'updated'
): Promise<void> {
  const forBlocks = nodeSimSearchInfo.forBlocks
  const dimensions = fastIndex.dimensions
  for (const blockKeyStr in forBlocks) {
    const embeddingJson = forBlocks[blockKeyStr]
    const projectionJson = await use.projectVector(embeddingJson, dimensions)
    const label = serializeFastProjectionKey({ nid, blockKeyStr })
    if (updateType === 'updated') {
      try {
        await fastIndex.knn.clearClass(label)
      } catch (err) {
        log.debug('Removing outdated projections from KNN failed with', err)
      }
    }
    let projection: tf.Tensor2D | null = null
    try {
      projection = use.tensor2dFromJson(projectionJson)
      await fastIndex.knn.addExample(projection, label)
    } finally {
      projection?.dispose()
    }
  }
}

/**
 * The euclidean distance threshold below which we call two texts relevant.
 * In data analysis, euclidean similarity is a measure of similarity between two
 * non-zero vectors defined in an inner product space.
 * https://en.wikipedia.org/wiki/Euclidean_distance
 *
 * We can safely assume that all texts with their vectors closeer than 1.0 are
 * related. Although, to be sure we take tighter threshold than 1.0, to avoid
 * giving somewhat irrelevant information.
 */
const kSimilarityEuclideanDistanceThreshold = 0.9

const kPhraseLenWordsMinToSearchWithTfJs = 5

function getSuggestionsNumberLimit(): number {
  return lodash.random(7, 12)
}

function throwIfCancelled(cancellationToken: CancellationToken): void {
  if (cancellationToken.canBeCancelled && cancellationToken.isCancelled) {
    throw new AbortError('Similarity search was canceled by CancellationToken')
  }
}

export type RelevantNode = {
  node: TNode
  score: number // Lower is better, 0 means perfect match
  matchedQuotes: NodeBlockKey[]
}
export async function findRelevantNodes(
  phrase: string,
  excludedNids: Set<Nid>,
  cancellationToken: CancellationToken,
  storage: StorageApi,
  analytics: BackgroundPosthog | null
): Promise<RelevantNode[]> {
  const timer = new Timer()
  throwIfCancelled(cancellationToken)
  const phraseDoc = wink_.readDoc(phrase)
  // Use plaintext search for a small queries, because similarity search based
  // on ML embeddings has a poor quality results on a small texts.
  const phraseLenWords = phraseDoc.tokens().length()
  if (phraseLenWords === 0) {
    throw new Error(
      'Similarity search failed because search phrase is empty string'
    )
  }
  let relevantNodes: RelevantNode[]
  let processedNodesCount: number
  let searchEngine: string
  // We fall back to using plain text search, if search phrase is short.
  if (phraseLenWords < kPhraseLenWordsMinToSearchWithTfJs) {
    searchEngine = 'Beagle'
    ;({ relevantNodes, processedNodesCount } =
      await findRelevantNodesUsingPlainTextSearch(
        phraseDoc,
        storage,
        excludedNids,
        cancellationToken
      ))
  } else {
    searchEngine = 'TFJS'
    ;({ relevantNodes, processedNodesCount } =
      await findRelevantNodesUsingSimilaritySearch(
        phrase,
        storage,
        excludedNids,
        cancellationToken,
        analytics
      ))
  }
  // Make sure results are sorted by score
  relevantNodes.sort((ar, br) => ar.score - br.score)
  const stats = getSimilaritySearchStats(relevantNodes)
  backgroundpa.performance(
    analytics,
    {
      ...stats,
      action: 'similarity: find relevant nodes',
      searchEngine,
      processedNodesCount,
      // The number of words in search phrase
      phraseLenWords,
    },
    timer,
    { andLog: true }
  )
  return relevantNodes
}

type SimilaritySearchStats = {
  scoreP20?: number
  scoreP80?: number
  scoreMax?: number
  scoreMin?: number
  resultsCount: number
}
/**
 * Expect `relevantNodes` argument to be sorted by score in ascending order, top
 * results first.
 */
function getSimilaritySearchStats(
  relevantNodes: RelevantNode[]
): SimilaritySearchStats | null {
  const resultsCount = relevantNodes.length
  if (resultsCount === 0) {
    return { resultsCount }
  }
  const scoreP20 = relevantNodes[Math.floor(resultsCount * 0.2)].score
  const scoreP80 = relevantNodes[Math.floor(resultsCount * 0.8)].score
  const scoreMax = relevantNodes[resultsCount - 1].score
  const scoreMin = relevantNodes[0].score
  return {
    resultsCount,
    scoreP20,
    scoreP80,
    scoreMax,
    scoreMin,
  }
}

type SimilaritySearchResultsInContext = {
  relevantNodes: RelevantNode[]
  // Overall number of nodes a search algorithm looked at during the search
  processedNodesCount: number
}

async function findRelevantNodesUsingSimilaritySearch(
  phrase: string,
  storage: StorageApi,
  excludedNids: Set<Nid>,
  cancellationToken: CancellationToken,
  analytics: BackgroundPosthog | null
): Promise<SimilaritySearchResultsInContext> {
  const { useState, fastIndex } = await getState(storage, analytics)
  const timer = new Timer()

  let phraseEmbedding: tf.Tensor2D | null = null
  let phraseEmbeddingProjected: tf.Tensor2D | null = null
  try {
    // @ts-ignore, see 'conflicting-tensor2d-versions' note
    phraseEmbedding = await useState.encoder.embed(phrase)
    phraseEmbeddingProjected = use.tensor2dFromJson(
      await use.projectVector(
        await use.tensor2dToJson(phraseEmbedding),
        fastIndex.dimensions
      )
    )
    throwIfCancelled(cancellationToken)
    backgroundpa.performance(
      analytics,
      { action: 'similarity: calculate phrase embedding' },
      timer,
      { andLog: true }
    )

    const relevantNodes = await findRelevantNodesBasedOnEmbeddingDistance(
      storage,
      fastIndex,
      phraseEmbedding,
      phraseEmbeddingProjected,
      excludedNids,
      cancellationToken,
      analytics
    )
    return {
      relevantNodes,
      processedNodesCount: fastIndex.knn.getNumClasses(),
    }
  } finally {
    phraseEmbedding?.dispose()
    phraseEmbeddingProjected?.dispose()
  }
}

async function findRelevantNodesBasedOnEmbeddingDistance(
  storage: StorageApi,
  fastIndex: FastIndex,
  phraseEmbedding: tf.Tensor2D,
  phraseEmbeddingProjected: tf.Tensor2D,
  excludedNids: Set<Nid>,
  cancellationToken: CancellationToken,
  analytics: BackgroundPosthog | null
): Promise<RelevantNode[]> {
  const timer = new Timer()
  const predictions = await fastIndex.knn.predictClass(
    phraseEmbeddingProjected,
    // TODO(Alexander): Select this number depending on how fast user machine
    // is, trying not to overload user's machine and keeping similarity search
    // latency under 4-5 seconds.
    99
  )
  backgroundpa.performance(
    analytics,
    { action: 'similarity: calculate fast results with KNN' },
    timer,
    { andLog: true }
  )
  throwIfCancelled(cancellationToken)

  // Have similarity search results as a map allows us to have more than 1 quote per node.
  const predictionsByNid: Map<Nid, NodeBlockKeyStr[]> = excludeByNid(
    groupByNid(predictions),
    excludedNids
  )

  const scoredBlocks = await calculateEuclideanDistances(
    phraseEmbedding,
    await enrichWithIndexes(storage, predictionsByNid, cancellationToken),
    cancellationToken
  )
  throwIfCancelled(cancellationToken)
  const bestMatches = takeNBestScoring(
    getBlocksOfSpecificField(
      filterBadlyScoringBlocks(
        scoredBlocks,
        kSimilarityEuclideanDistanceThreshold
      ),
      'web-text'
    ),
    kNumberOfQuotesPerNodeLimit
  )
  return await enrichWithNodes(storage, bestMatches)
}

/**
 * Grouping prediction results by nid minimises N of
 * requests to smuggler api. This is because node embeddings are stored by nid.
 */
function groupByNid(
  prediction: Awaited<ReturnType<AsyncKnnClassifier['predictClass']>>
): Map<Nid, NodeBlockKeyStr[]> {
  const ret: Map<Nid, NodeBlockKeyStr[]> = new Map()

  for (const [label /*, confidence */] of Object.entries(
    prediction.confidences
  ).filter(([_label, confidence]: [string, number]) => confidence > 0)) {
    const { nid, blockKeyStr } = deserializeFastProjectionKey(label)
    let other = ret.get(nid)
    if (other == null) {
      other = []
    }
    other.push(blockKeyStr)
    ret.set(nid, other)
  }

  return ret
}

async function enrichWithIndexes(
  storage: StorageApi,
  input: Map<Nid, NodeBlockKeyStr[]>,
  cancellationToken: CancellationToken
): Promise<
  Map<
    Nid,
    { blockKeys: NodeBlockKeyStr[]; index: NodeSimilaritySearchInfoLatest }
  >
> {
  const ret: Map<
    Nid,
    { blockKeys: NodeBlockKeyStr[]; index: NodeSimilaritySearchInfoLatest }
  > = new Map()
  for (const [nid, blockKeyStrs] of input.entries()) {
    throwIfCancelled(cancellationToken)
    const nodeSimSearchInfo = verifySimilaritySearchInfoVersion(
      await storage.node.similarity.getIndex({ nid })
    )

    if (nodeSimSearchInfo == null) {
      // Skip nodes with invalid index.
      //
      // Ideally we should not get invalid indexes here, because whatever
      // results we get from KNN are the results for up to date embeddings. But
      // this is also needed for typesafety, TS complains, if we don't check the
      // type of what we get from local storage.
      log.warning(`Similarity index for node ${nid} is outdated`)
      continue
    }

    ret.set(nid, {
      blockKeys: blockKeyStrs,
      index: nodeSimSearchInfo,
    })
  }
  return ret
}

async function calculateEuclideanDistances(
  phraseEmbedding: tf.Tensor2D,
  input: Map<
    Nid,
    { blockKeys: NodeBlockKeyStr[]; index: NodeSimilaritySearchInfoLatest }
  >,
  cancellationToken: CancellationToken
) {
  const ret: Map<Nid, { blockKeyStr: NodeBlockKeyStr; score: number }[]> =
    new Map()
  for (const [nid, { blockKeys, index }] of input.entries()) {
    throwIfCancelled(cancellationToken)
    const forNode: { blockKeyStr: NodeBlockKeyStr; score: number }[] = []
    for (const blockKeyStr of blockKeys) {
      throwIfCancelled(cancellationToken)
      const embeddingJson = index.forBlocks[blockKeyStr]
      if (embeddingJson == null) {
        log.error(`No such embedding for a node ${nid} and key ${blockKeyStr}`)
      }
      let embedding: tf.Tensor2D | null = null
      let score: number | null = null
      try {
        embedding = use.tensor2dFromJson(embeddingJson)
        score = await use.euclideanDistance(embedding, phraseEmbedding)
      } finally {
        embedding?.dispose()
        embedding = null
      }
      forNode.push({ blockKeyStr, score })
    }
    ret.set(nid, forNode)
  }
  return ret
}

function filterBadlyScoringBlocks(
  input: Map<Nid, { blockKeyStr: NodeBlockKeyStr; score: number }[]>,
  euclideanDistanceThreshold: number
) {
  const ret: Map<Nid, { blockKeyStr: NodeBlockKeyStr; score: number }[]> =
    new Map()
  for (const [nid, blocks] of input.entries()) {
    const forNode: { blockKeyStr: NodeBlockKeyStr; score: number }[] = []
    for (const { blockKeyStr, score } of blocks) {
      if (score < euclideanDistanceThreshold) {
        forNode.push({ blockKeyStr, score })
      }
    }
    ret.set(nid, forNode)
  }
  return ret
}

function takeNBestScoring(
  input: Map<Nid, { blockKey: NodeBlockKey; score: number }[]>,
  numberToTake: number
): Map<Nid, { bestScore: number; blockKeys: NodeBlockKey[] }> {
  const ret: ReturnType<typeof takeNBestScoring> = new Map()
  for (const [nid, blocks] of input.entries()) {
    blocks.sort((ar, br) => ar.score - br.score)
    // Limit number of quotes per node and repack
    const topN = blocks.slice(0, numberToTake)
    ret.set(nid, {
      blockKeys: topN.map(({ blockKey }) => blockKey),
      bestScore: topN.length > 0 ? topN[0].score : 0,
    })
  }
  return ret
}

function getBlocksOfSpecificField(
  input: Map<Nid, { blockKeyStr: NodeBlockKeyStr; score: number }[]>,
  field: NodeBlockKey['field']
): Map<Nid, { blockKey: NodeBlockKey; score: number }[]> {
  const ret: ReturnType<typeof getBlocksOfSpecificField> = new Map()
  for (const [nid, blockKeyStrs] of input.entries()) {
    const blockKeys: { blockKey: NodeBlockKey; score: number }[] = []
    for (const { blockKeyStr, score } of blockKeyStrs) {
      try {
        const blockKey = nodeBlockKeyFromString(blockKeyStr)
        if (blockKey.field === field) {
          blockKeys.push({ blockKey, score })
        }
      } catch (err) {
        log.error('Failed to extrect block key from string', err)
      }
    }
    ret.set(nid, blockKeys)
  }
  return ret
}

async function enrichWithNodes(
  storage: StorageApi,
  input: Map<Nid, { bestScore: number; blockKeys: NodeBlockKey[] }>
): Promise<RelevantNode[]> {
  const nodeMap: Map<Nid, TNode> = new Map()
  {
    const nids: Nid[] = []
    input.forEach((_, nid) => nids.push(nid))
    const resp = await storage.node.batch.get({ nids })
    for (const node of resp.nodes) {
      nodeMap.set(node.nid, node)
    }
  }

  const ret: RelevantNode[] = []
  for (const [nid, { blockKeys, bestScore }] of input.entries()) {
    const node = nodeMap.get(nid)
    if (node == null) {
      log.error(
        `Foreword can't find node for nid ${nid}, can't use it in similarity search`
      )
      continue
    }
    ret.push({ node, matchedQuotes: blockKeys, score: bestScore })
  }
  return ret
}

function excludeByNid(input: Map<Nid, NodeBlockKeyStr[]>, excluded: Set<Nid>) {
  for (const nid in excluded) {
    input.delete(nid)
  }
  return input
}

async function findRelevantNodesUsingPlainTextSearch(
  phraseDoc: wink.WinkDocument,
  storage: StorageApi,
  excludedNids: Set<Nid>,
  cancellationToken: CancellationToken
): Promise<SimilaritySearchResultsInContext> {
  // Let's do a bit of a trick here, using stemmed forms of the words to search:
  // http://snowball.tartarus.org/algorithms/english/stemmer.html
  // If it proves to be working fine, I suggest we even used it for the search
  // in Truthsayer.
  const poses = phraseDoc.tokens().out(wink_.its.pos)
  const stems = phraseDoc
    .tokens()
    .out(wink_.its.stem)
    .filter((_stem: string, index: number) => {
      const pos = poses[index]
      return pos !== 'PUNCT' && pos !== 'SPACE'
    })
  const beagle = new Beagle(stems)
  const relevantNodes: RelevantNode[] = []
  let processedNodesCount = 0
  const iter = await storage.node.iterate()
  const expectedLimit = getSuggestionsNumberLimit()
  while (true) {
    throwIfCancelled(cancellationToken)
    const node = await iter.next()
    if (!node) {
      break
    }
    if (!!excludedNids.has(node.nid)) {
      continue
    }
    ++processedNodesCount
    if (beagle.searchNode(node) != null) {
      relevantNodes.push({ node, score: 0, matchedQuotes: [] })
    }
    if (relevantNodes.length >= expectedLimit) {
      break
    }
  }
  return { relevantNodes, processedNodesCount }
}

function getNodePatchAsString(patch: NodeEventPatch): {
  plaintext: string
  textContentBlocks: TextContentBlock[]
  coment?: string
  extQuote?: string
  attrs?: string
} {
  let coment: string | undefined = undefined
  const textContentBlocks: TextContentBlock[] = []
  const attrs: (string | undefined)[] = [
    patch.extattrs?.title,
    patch.extattrs?.author,
    patch.extattrs?.description,
    patch.index_text?.labels?.join(', '),
    patch.index_text?.brands?.join(', '),
    patch.extattrs?.web?.url,
    patch.extattrs?.web_quote?.url,
  ].filter((v) => v != null)
  let lines: (string | undefined)[] = [...attrs]
  if (patch.extattrs?.web?.text) {
    textContentBlocks.push(...patch.extattrs?.web?.text.blocks)
    lines.push(...textContentBlocks.map(({ text }) => text))
  }
  if (patch.index_text?.plaintext) {
    textContentBlocks.push({ text: patch.index_text?.plaintext, type: 'P' })
    lines.push(patch.index_text?.plaintext)
  }
  if (patch.text) {
    const doc = TDoc.fromNodeTextData(patch.text)
    const docAsPlaintext = doc.genPlainText()
    lines.push(docAsPlaintext)
    coment = docAsPlaintext
  }
  const extQuote = patch.extattrs?.web_quote?.text ?? undefined
  if (extQuote) {
    lines.push(extQuote)
  }
  let plaintext = lines
    .filter((v) => v != null)
    .join('.\n')
    .trim()
  if (!plaintext) {
    // Hack: Embedding fails on completely empty string
    plaintext = 'empty'
  }
  return {
    plaintext,
    textContentBlocks,
    coment,
    extQuote,
    attrs: attrs.join('.\n').trim(),
  }
}

async function updateNodeIndex(
  storage: StorageApi,
  fastIndex: FastIndex,
  nid: Nid,
  patch: NodeEventPatch,
  useState: use.State,
  updateType: 'created' | 'updated'
): Promise<void> {
  const { plaintext, textContentBlocks, coment, extQuote, attrs } =
    getNodePatchAsString(patch)
  const forBlocks: Record<string, TfEmbeddingJson> = {}
  {
    let embedding: tf.Tensor2D | null = null
    try {
      // @ts-ignore, see 'conflicting-tensor2d-versions' note
      embedding = await useState.encoder.embed(plaintext)
      forBlocks[nodeBlockKeyToString({ field: '*' })] =
        await use.tensor2dToJson(embedding)
    } finally {
      embedding?.dispose()
    }
  }
  if (coment) {
    let embedding: tf.Tensor2D | null = null
    try {
      // @ts-ignore, see 'conflicting-tensor2d-versions' note
      embedding = await useState.encoder.embed(coment)
      forBlocks[nodeBlockKeyToString({ field: 'text' })] =
        await use.tensor2dToJson(embedding)
    } finally {
      embedding?.dispose()
    }
  }
  if (extQuote) {
    let embedding: tf.Tensor2D | null = null
    try {
      // @ts-ignore, see 'conflicting-tensor2d-versions' note
      embedding = await useState.encoder.embed(extQuote)
      forBlocks[nodeBlockKeyToString({ field: 'web-quote' })] =
        await use.tensor2dToJson(embedding)
    } finally {
      embedding?.dispose()
    }
  }
  if (attrs) {
    let embedding: tf.Tensor2D | null = null
    try {
      // @ts-ignore, see 'conflicting-tensor2d-versions' note
      embedding = await useState.encoder.embed(attrs)
      forBlocks[nodeBlockKeyToString({ field: 'attrs' })] =
        await use.tensor2dToJson(embedding)
    } finally {
      embedding?.dispose()
    }
  }
  for (let index = 0; index < textContentBlocks.length; ++index) {
    const { text } = textContentBlocks[index]
    // Quick test if paragraph text is short enough to care to check the length
    // of it in words. Average length of a word in English is 5 characters, for
    // a fast check I used 4.7 * 5 + some buffer = 30
    if (text.length < 30) {
      const wordCount = wink_.readDoc(text).tokens().length()
      if (wordCount < kPhraseLenWordsMinToSearchWithTfJs) {
        // Embeddings-based similarity search perform extremely poorly with short
        // sentences, basically short texts never appear in the results. Hence
        // there is no reason to waiste time on calculating embeddings for those.
        continue
      }
    }
    let embedding: tf.Tensor2D | null = null
    try {
      // @ts-ignore, see 'conflicting-tensor2d-versions' note
      embedding = await useState.encoder.embed(text)
      const blockKeyStr = nodeBlockKeyToString({ field: 'web-text', index })
      forBlocks[blockKeyStr] = await use.tensor2dToJson(embedding)
    } finally {
      embedding?.dispose()
    }
  }
  const simsearch = createNodeSimilaritySearchInfoLatest({ forBlocks })
  await updateNodeFastIndex(fastIndex, nid, simsearch, updateType)
  await storage.node.similarity.setIndex({ nid, simsearch })
}

function createNodeEventListener(
  storage: StorageApi,
  analytics: BackgroundPosthog | null
): NodeEventListener {
  return async (type: NodeEventType, nid: Nid, patch: NodeEventPatch) => {
    try {
      const { useState, fastIndex } = await getState(storage, analytics)
      const timer = new Timer()
      switch (type) {
        case 'created':
        case 'updated': {
          await updateNodeIndex(storage, fastIndex, nid, patch, useState, type)
          break
        }
        case 'will-delete': {
          // Storage API will delete all node embeddings from storage by nid, so
          // we don't need to worry about it here. But, we need to clean up
          // projections from fast index, for that we subscribe for the event
          // 'will-delete' that precede node deletion.
          const nodeSimSearchInfo = verifySimilaritySearchInfoVersion(
            await storage.node.similarity.getIndex({ nid })
          )
          if (nodeSimSearchInfo != null) {
            for (const blockKeyStr in nodeSimSearchInfo.forBlocks) {
              const label = serializeFastProjectionKey({ nid, blockKeyStr })
              await fastIndex.knn.clearClass(label)
            }
          }
          break
        }
      }
      backgroundpa.performance(
        analytics,
        { action: 'similarity: update node index', indexChangeType: type },
        timer,
        { andLog: true }
      )
    } catch (e) {
      backgroundpa.error(
        analytics,
        {
          location: 'background',
          cause: errorise(e).message,
          failedTo: `ensure similarity search index integrity for node`,
        },
        { andLog: true }
      )
    }
  }
}

async function ensurePerNodeSimSearchIndexIntegrity(
  storage: StorageApi,
  statePromise: Promise<State | undefined>,
  analytics: BackgroundPosthog | null
): Promise<void> {
  const state = await statePromise
  if (state == null) {
    throw new Error('Similarity state was not initialized')
  }
  const { useState, fastIndex } = state
  const allNids = await storage.node.getAllNids({})
  for (let ind = 0; ind < allNids.length; ++ind) {
    const nid = allNids[ind]
    try {
      // Failure to update one index should not interfere with others
      const nodeSimSearchInfo = verifySimilaritySearchInfoVersion(
        await storage.node.similarity.getIndex({
          nid,
        })
      )
      if (nodeSimSearchInfo == null) {
        log.info(
          `Update similarity index for [${ind + 1}/${allNids.length}] ${nid}`
        )
        const node = await storage.node.get({ nid })
        const timer = new Timer()
        await updateNodeIndex(
          storage,
          fastIndex,
          nid,
          { ...node },
          useState,
          'updated'
        )
        backgroundpa.performance(
          analytics,
          {
            action: 'similarity: update node index',
            indexChangeType: 'updated',
          },
          timer,
          { andLog: true }
        )
      }
    } catch (e) {
      backgroundpa.error(
        analytics,
        {
          location: 'background',
          cause: errorise(e).message,
          failedTo: 'update similarity search index for node',
        },
        { andLog: true }
      )
    }
  }
}

export async function register(
  storage: StorageApi,
  analytics: BackgroundPosthog | null
) {
  const timer = new Timer()
  // Run it as non-blocking async call
  const state: Promise<State | undefined> = getState(storage, analytics).catch(
    (reason) => {
      backgroundpa.error(
        analytics,
        {
          location: 'background',
          cause: errorise(reason).message,
          failedTo: 'create similarity state',
        },
        { andLog: true }
      )
      return undefined
    }
  )
  ensurePerNodeSimSearchIndexIntegrity(storage, state, analytics).catch(
    (reason) => {
      backgroundpa.error(
        analytics,
        {
          location: 'background',
          cause: errorise(reason).message,
          failedTo: 'ensure similarity search index integrity',
        },
        { andLog: true }
      )
    }
  )

  const nodeEventListener = createNodeEventListener(storage, analytics)
  storage.node.addListener(nodeEventListener)
  log.debug('Similarity search module is loaded', timer.elapsedSecondsPretty())
  return async () => {
    storage.node.removeListener(nodeEventListener)
    ;(await state)?.fastIndex.knn.dispose()
    _state = null
  }
}
