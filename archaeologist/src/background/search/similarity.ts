import lodash from 'lodash'
import { tf, wink } from 'text-information-retrieval'
import type {
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
} from 'smuggler-api'
import {
  verifySimilaritySearchInfoVersion,
  nodeBlockKeyToString,
  nodeBlockKeyFromString,
  createNodeSimilaritySearchInfoLatest,
} from 'smuggler-api'
import { TDoc, Beagle } from 'elementary'
import CancellationToken from 'cancellationtoken'
import { log, errorise, AbortError, Timer } from 'armoury'
import { backgroundpa, BackgroundPosthog } from '../productanalytics'

const wink_ = wink.loadModel()

let _tfState: tf.TfState | undefined = undefined

async function createTfState(
  analytics: BackgroundPosthog | null
): Promise<tf.TfState> {
  if (_tfState == null) {
    const timer = new Timer()
    _tfState = await tf.createTfState()
    backgroundpa.performance(
      analytics,
      { action: 'similarity: ML model initial load' },
      timer,
      { andLog: true }
    )
  }
  return _tfState
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
 * We use 512 → 49 reduction.
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
  knn: tf.KNNClassifier
}

// See comment for `FastIndex`
const kProjectionSize = 49

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

let _fastIndex: FastIndex | undefined = undefined

async function getFastIndex(
  storage: StorageApi,
  analytics: BackgroundPosthog | null,
  sampleVector: tf.Tensor2D
): Promise<FastIndex> {
  if (_fastIndex != null) {
    return _fastIndex
  }
  const timer = new Timer()
  const dimensions = tf.sampleDimensions(sampleVector, kProjectionSize)
  const knn = new tf.KNNClassifier()
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
    for (const blockKeyStr in forBlocks) {
      const embeddingJson = forBlocks[blockKeyStr]
      const projection = tf.projectVector(
        tf.tensor2dFromJson(embeddingJson),
        dimensions
      )
      const label = serializeFastProjectionKey({ nid, blockKeyStr })
      knn.addExample(projection, label)
    }
  }
  backgroundpa.performance(
    analytics,
    { action: 'similarity: create fast simsearch index' },
    timer,
    { andLog: true }
  )
  _fastIndex = { dimensions, knn }
  return _fastIndex
}

async function updateNodeFastIndex(
  nid: Nid,
  nodeSimSearchInfo: NodeSimilaritySearchInfoLatest,
  updateType: 'created' | 'updated'
): Promise<void> {
  if (_fastIndex == null) {
    return
  }
  const forBlocks = nodeSimSearchInfo.forBlocks
  const dimensions = _fastIndex.dimensions
  for (const blockKeyStr in forBlocks) {
    const embeddingJson = forBlocks[blockKeyStr]
    const projection = tf.projectVector(
      tf.tensor2dFromJson(embeddingJson),
      dimensions
    )
    const label = serializeFastProjectionKey({ nid, blockKeyStr })
    if (updateType === 'updated') {
      try {
        _fastIndex.knn.clearClass(label)
      } catch (err) {
        log.debug('Removing outdated projections from KNN failed with', err)
      }
    }
    _fastIndex.knn.addExample(projection, label)
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
const kSimilarityEuclideanDistanceThreshold = 0.91

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
  const phraseLen = phraseDoc.tokens().length()
  if (phraseLen === 0) {
    throw new Error(
      'Similarity search failed because search phrase is empty string'
    )
  }
  let relevantNodes: RelevantNode[]
  let searchEngine: string
  // We fall back to using plain text search, if search phrase is short.
  if (phraseLen < 9) {
    searchEngine = 'Beagle'
    relevantNodes = await findRelevantNodesUsingPlainTextSearch(
      phraseDoc,
      storage,
      excludedNids,
      cancellationToken
    )
  } else {
    searchEngine = 'TFJS'
    relevantNodes = await findRelevantNodesUsingSimilaritySearch(
      phrase,
      storage,
      excludedNids,
      cancellationToken,
      analytics
    )
  }
  backgroundpa.performance(
    analytics,
    { action: 'similarity: find relevant nodes', searchEngine },
    timer,
    { andLog: true }
  )
  return relevantNodes
}

async function findRelevantNodesUsingSimilaritySearch(
  phrase: string,
  storage: StorageApi,
  excludedNids: Set<Nid>,
  cancellationToken: CancellationToken,
  analytics: BackgroundPosthog | null
): Promise<RelevantNode[]> {
  const tfState = await createTfState(analytics)
  let timer = new Timer()
  const phraseEmbedding = await tfState.encoder.embed(phrase)
  backgroundpa.performance(
    analytics,
    { action: 'similarity: calculate phrase embedding' },
    timer,
    { andLog: true }
  )
  throwIfCancelled(cancellationToken)
  timer = new Timer()
  const fastIndex = await getFastIndex(storage, analytics, phraseEmbedding)
  throwIfCancelled(cancellationToken)
  const phraseEmbeddingProjected = tf.projectVector(
    phraseEmbedding,
    fastIndex.dimensions
  )
  const fastKnnResults = await fastIndex.knn.predictClass(
    phraseEmbeddingProjected,
    // TODO(Alexander): Select this number depending on how fast user machine
    // is, trying not to overload user's machine and keeping similarity search
    // latency under 4-5 seconds.
    99
  )
  throwIfCancelled(cancellationToken)
  // Now we need to repack values, groupping them by nid, to minimise N of
  // requests to smuggler api. This is because node embeddings are stored by nid
  const fastResultsByNid: Map<Nid, NodeBlockKeyStr[]> = new Map() // Nid -> Block keys (str)
  for (const [label /*, confidence */] of Object.entries(
    fastKnnResults.confidences
  ).filter(([_label, confidence]: [string, number]) => confidence > 0)) {
    const { nid, blockKeyStr } = deserializeFastProjectionKey(label)
    throwIfCancelled(cancellationToken)
    if (excludedNids.has(nid)) {
      continue
    }
    let other = fastResultsByNid.get(nid)
    if (other == null) {
      other = []
    }
    other.push(blockKeyStr)
    fastResultsByNid.set(nid, other)
  }
  backgroundpa.performance(
    analytics,
    { action: 'similarity: calculate fast results with KNN' },
    timer,
    { andLog: true }
  )
  // Have similarity search results as a map allows us to have more than 1 quote per node.
  let rawSimilarityResults: Map<
    Nid,
    { blockKeyStr: NodeBlockKeyStr; score: number }[]
  > = new Map()
  for (const [nid, blockKeyStrs] of fastResultsByNid.entries()) {
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
    for (const blockKeyStr of blockKeyStrs) {
      throwIfCancelled(cancellationToken)
      const embeddingJson = nodeSimSearchInfo.forBlocks[blockKeyStr]
      if (embeddingJson == null) {
        log.error(`No such embedding for a node ${nid} and key ${blockKeyStr}`)
      }
      const embedding = tf.tensor2dFromJson(embeddingJson)
      const score = tf.euclideanDistance(embedding, phraseEmbedding)
      if (score < kSimilarityEuclideanDistanceThreshold) {
        let other = rawSimilarityResults.get(nid)
        if (other == null) {
          other = []
        }
        other.push({ blockKeyStr, score })
        rawSimilarityResults.set(nid, other)
      }
    }
    throwIfCancelled(cancellationToken)
  }
  const nodeMap: Map<Nid, TNode> = new Map()
  {
    const nids = Array.from(rawSimilarityResults.keys())
    const resp = await storage.node.batch.get({ nids })
    for (const node of resp.nodes) {
      nodeMap.set(node.nid, node)
    }
  }
  const relevantNodes: RelevantNode[] = []
  for (const [nid, blocks] of rawSimilarityResults.entries()) {
    const node = nodeMap.get(nid)
    if (node == null) {
      log.error(
        `Mazed can't extract node for nid ${nid}, can't use it in similarity search`
      )
      continue
    }
    let bestScore = 1
    let directQuoteBlocks = blocks.map(
      ({
        blockKeyStr,
        score,
      }): {
        blockKey?: NodeBlockKey
        score: number
      } => {
        bestScore = Math.min(score, bestScore)
        let blockKey: NodeBlockKey | undefined = undefined
        try {
          blockKey = nodeBlockKeyFromString(blockKeyStr)
          if (blockKey.field !== 'web-text') {
            // We don't need any other types of blocks for direct quote
            blockKey = undefined
          }
        } catch (err) {
          log.error('Direct quote extraction failed', err)
        }
        return { blockKey, score }
      }
    )
    directQuoteBlocks.sort((ar, br) => ar.score - br.score)
    // Limit number of quotes per node and repack
    const matchedQuotes: NodeBlockKey[] = []
    for (const { blockKey } of directQuoteBlocks.slice(0, 3)) {
      if (blockKey != null) {
        matchedQuotes.push(blockKey)
      }
    }
    relevantNodes.push({ node, matchedQuotes, score: bestScore })
  }
  return relevantNodes
}

async function findRelevantNodesUsingPlainTextSearch(
  phraseDoc: wink.WinkDocument,
  storage: StorageApi,
  excludedNids: Set<Nid>,
  cancellationToken: CancellationToken
): Promise<RelevantNode[]> {
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
  const nodesWithScore: RelevantNode[] = []
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
    if (beagle.searchNode(node) != null) {
      nodesWithScore.push({ node, score: 0, matchedQuotes: [] })
    }
    if (nodesWithScore.length >= expectedLimit) {
      break
    }
  }
  return nodesWithScore
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
  nid: Nid,
  patch: NodeEventPatch,
  tfState: tf.TfState,
  updateType: 'created' | 'updated'
): Promise<void> {
  const { plaintext, textContentBlocks, coment, extQuote, attrs } =
    getNodePatchAsString(patch)
  const forBlocks: Record<string, TfEmbeddingJson> = {}
  {
    const embedding = await tfState.encoder.embed(plaintext)
    forBlocks[nodeBlockKeyToString({ field: '*' })] =
      tf.tensor2dToJson(embedding)
  }
  if (coment) {
    const embedding = await tfState.encoder.embed(coment)
    forBlocks[nodeBlockKeyToString({ field: 'text' })] =
      tf.tensor2dToJson(embedding)
  }
  if (extQuote) {
    const embedding = await tfState.encoder.embed(extQuote)
    forBlocks[nodeBlockKeyToString({ field: 'web-quote' })] =
      tf.tensor2dToJson(embedding)
  }
  if (attrs) {
    const embedding = await tfState.encoder.embed(attrs)
    forBlocks[nodeBlockKeyToString({ field: 'attrs' })] =
      tf.tensor2dToJson(embedding)
  }
  for (let index = 0; index < textContentBlocks.length; ++index) {
    const { text } = textContentBlocks[index]
    if (text.length < 50) {
      // Embeddings-based similarity search perform extremely poorly with short
      // sentences, basically short texts never appear in the results. Hence
      // there is no reason to waiste time on calculating embeddings for those.
      continue
    }
    const embedding = await tfState.encoder.embed(text)
    const blockKeyStr = nodeBlockKeyToString({ field: 'web-text', index })
    forBlocks[blockKeyStr] = tf.tensor2dToJson(embedding)
  }
  const simsearch = createNodeSimilaritySearchInfoLatest({ forBlocks })
  updateNodeFastIndex(nid, simsearch, updateType)
  await storage.node.similarity.setIndex({ nid, simsearch })
}

function createNodeEventListener(
  storage: StorageApi,
  analytics: BackgroundPosthog | null
): NodeEventListener {
  return async (type: NodeEventType, nid: Nid, patch: NodeEventPatch) => {
    if (type !== 'created' && type !== 'updated') {
      return
    }
    try {
      const timer = new Timer()
      const tfState = await createTfState(analytics)
      await updateNodeIndex(storage, nid, patch, tfState, type)
      backgroundpa.performance(
        analytics,
        { action: 'similarity: update node index' },
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
  analytics: BackgroundPosthog | null
): Promise<void> {
  const tfState = await createTfState(analytics)
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
        await updateNodeIndex(storage, nid, { ...node }, tfState, 'updated')
        backgroundpa.performance(
          analytics,
          { action: 'similarity: update node index' },
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
  ensurePerNodeSimSearchIndexIntegrity(storage, analytics).catch((reason) => {
    backgroundpa.error(
      analytics,
      {
        location: 'background',
        cause: errorise(reason).message,
        failedTo: 'ensure similarity search index integrity',
      },
      { andLog: true }
    )
  })

  const nodeEventListener = createNodeEventListener(storage, analytics)
  storage.node.addListener(nodeEventListener)
  log.debug('Similarity search module is loaded', timer.elapsedSecondsPretty())
  return () => {
    storage.node.removeListener(nodeEventListener)
    _tfState = undefined
  }
}
