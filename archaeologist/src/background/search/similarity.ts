import lodash from 'lodash'
import { tfUse as tf, loadWinkModel, bm25 } from 'text-information-retrieval'
import type { LongestCommonContinuousPiece } from 'text-information-retrieval'
import type {
  NodeEventType,
  NodeEventPatch,
  TfEmbeddingJson,
  NodeEventListener,
  Nid,
  TNode,
  NodeBlockKey,
  StorageApi,
  TextContentBlock,
  NodeSimilaritySearchInfoLatestVerstion,
} from 'smuggler-api'
import {
  verifySimilaritySearchInfoVersion,
  nodeBlockKeyToString,
  nodeBlockKeyFromString,
  getNodeStringField,
} from 'smuggler-api'
import { TDoc, Beagle } from 'elementary'
import CancellationToken from 'cancellationtoken'
import { log, errorise, AbortError, Timer } from 'armoury'
import type { BackgroundPosthog } from '../productanalytics'

const wink_ = loadWinkModel()

let _tfState: tf.TfState | undefined = undefined

async function createTfState(): Promise<tf.TfState> {
  if (_tfState == null) {
    _tfState = await tf.createTfState()
  }
  return _tfState
}

type BlockEmbeddingProjection = {
  nid: Nid
  blockKeyStr: string
  projection: tf.Tensor2D
}

type FastIndex = {
  dimensions: number[]
  projections: BlockEmbeddingProjection[]
}

type FastResult = {
  nid: Nid
  blockKeyStr: string
  score: number
}

let _fastIndex: FastIndex | undefined = undefined

async function getFastIndex(
  storage: StorageApi,
  sampleVector: tf.Tensor2D
): Promise<FastIndex> {
  if (_fastIndex != null) {
    return _fastIndex
  }
  const timer = new Timer()
  const dimensions = tf.sampleDimensions(sampleVector, 42)
  const projections: BlockEmbeddingProjection[] = []
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
      projections.push({ blockKeyStr, nid, projection })
    }
  }
  log.debug(`Fast simsearch index created in ${timer.elapsedSecondsPretty()}`)
  _fastIndex = { dimensions, projections }
  return _fastIndex
}

async function updateNodeFastIndex(
  nid: Nid,
  nodeSimSearchInfo: NodeSimilaritySearchInfoLatestVerstion
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
    _fastIndex.projections.push({ blockKeyStr, nid, projection })
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
const kSimilarityEuclideanDistanceThreshold = 0.96

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
  score: number
  matchedPiece?: LongestCommonContinuousPiece
}
export async function findRelevantNodes(
  phrase: string,
  excludedNids: Set<Nid>,
  cancellationToken: CancellationToken,
  storage: StorageApi,
  _analytics: BackgroundPosthog | null
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
  let searchEngineName: string
  let relevantNodes: RelevantNode[]
  if (phraseLen < 4) {
    searchEngineName = 'Beagle'
    relevantNodes = await findRelevantNodesUsingPlainTextSearch(
      phraseDoc,
      storage,
      excludedNids,
      cancellationToken
    )
  } else {
    searchEngineName = 'TFJS'
    relevantNodes = await findRelevantNodesUsingSimilaritySearch(
      phrase,
      storage,
      excludedNids,
      cancellationToken
    )
  }
  log.debug(
    `Similarity search results [${searchEngineName}] in ${timer.elapsedSecondsPretty()}`,
    relevantNodes
  )
  return relevantNodes
}

async function findRelevantNodesUsingSimilaritySearch(
  phrase: string,
  storage: StorageApi,
  excludedNids: Set<Nid>,
  cancellationToken: CancellationToken
): Promise<RelevantNode[]> {
  const timer = new Timer()
  const tfState = await createTfState()
  const phraseEmbedding = await tfState.encoder.embed(phrase)
  log.debug(`Phrase embedding are calculated ${timer.elapsedSecondsPretty()}`)
  throwIfCancelled(cancellationToken)
  const fastIndex = await getFastIndex(storage, phraseEmbedding)
  throwIfCancelled(cancellationToken)
  const phraseEmbeddingProjected = tf.projectVector(
    phraseEmbedding,
    fastIndex.dimensions
  )
  let fastResults: FastResult[] = []
  for (const { blockKeyStr, nid, projection } of fastIndex.projections) {
    throwIfCancelled(cancellationToken)
    if (excludedNids.has(nid)) {
      continue
    }
    const score = tf.euclideanDistance(phraseEmbeddingProjected, projection)
    if (score < 0.3) {
      fastResults.push({ blockKeyStr, nid, score })
    }
  }
  fastResults.sort((a, b) => a.score - b.score)
  // Top N Fast Results to look closely
  fastResults = fastResults.slice(0, 42)
  log.debug(
    `Fast results are calculated in ${timer.elapsedSecondsPretty()} (${
      fastIndex.projections.length
    })`,
    fastResults
  )
  let rawSimilarityResults: FastResult[] = []
  for (const { nid, blockKeyStr } of fastResults) {
    throwIfCancelled(cancellationToken)
    const nodeSimSearchInfo = verifySimilaritySearchInfoVersion(
      await storage.node.similarity.getIndex({ nid })
    )
    if (nodeSimSearchInfo == null) {
      // Skip nodes with invalid index
      log.warning(`Similarity index for node ${nid} is outdated`)
      continue
    }
    const embeddingJson = nodeSimSearchInfo.forBlocks[blockKeyStr]
    if (embeddingJson == null) {
      log.error(`No such embedding for a node ${nid} and key ${blockKeyStr}`)
    }
    const embedding = tf.tensor2dFromJson(embeddingJson)
    const score = tf.euclideanDistance(embedding, phraseEmbedding)
    if (score < kSimilarityEuclideanDistanceThreshold) {
      rawSimilarityResults.push({ nid, blockKeyStr, score })
    }
  }
  // Sort once again and leave exactly 1 result per node
  rawSimilarityResults = rawSimilarityResults.sort((a, b) => a.score - b.score)
  const knownBlocksForNids: Map<Nid, string> = new Map()
  // To have each nid no more than once per phrase
  rawSimilarityResults = rawSimilarityResults.filter(({ nid, blockKeyStr }) => {
    const knownNid = knownBlocksForNids.has(nid)
    if (knownNid) {
      // Saw this node before and has block key for it
      return false
    }
    knownBlocksForNids.set(nid, blockKeyStr)
    return true
  })
  log.debug(
    'RawSimilarityResults are calculated',
    timer.elapsedSecondsPretty(),
    rawSimilarityResults
  )
  // Cut the long tail of results - we can't and we shouldn't show more relevant
  // results than some limit
  rawSimilarityResults.sort((ar, br) => ar.score - br.score)
  rawSimilarityResults = rawSimilarityResults.slice(
    0,
    getSuggestionsNumberLimit()
  )
  const nodeMap: Map<Nid, TNode> = new Map()
  {
    const resp = await storage.node.batch.get({
      nids: rawSimilarityResults.map(({ nid }) => nid),
    })
    for (const node of resp.nodes) {
      nodeMap.set(node.nid, node)
    }
  }
  const relevantNodes: RelevantNode[] = []
  for (const { nid, score, blockKeyStr } of rawSimilarityResults) {
    const node = nodeMap.get(nid)
    if (node == null) {
      log.error(
        `Mazed can't extract node for nid ${nid}, can't use it in similarity search`
      )
      continue
    }
    let matchedPiece: LongestCommonContinuousPiece | undefined = undefined
    try {
      const blockKey = nodeBlockKeyFromString(blockKeyStr)
      if (blockKey.field === 'index-txt') {
        const text = getNodeStringField(node, blockKey)
        if (text) {
          const nextBlockKey: NodeBlockKey = {
            ...blockKey,
            index: blockKey.index + 1,
          }
          const prevBlockKey: NodeBlockKey = {
            ...blockKey,
            index: blockKey.index - 1,
          }
          matchedPiece = {
            matchTokensCount: 100,
            matchValuableTokensCount: 100,
            match: text,
            prefix: getNodeStringField(node, prevBlockKey) ?? '',
            suffix: getNodeStringField(node, nextBlockKey) ?? '',
          }
        }
      }
    } catch (err) {
      log.error('Direct quote extraction failed', err)
    }
    relevantNodes.push({ node, score, matchedPiece })
  }
  return relevantNodes
}

async function tryToMergeParagraphs(
  textContentBlocks: TextContentBlock[]
): Promise<void> {
  const timer = new Timer()
  const tfState = await createTfState()
  const embeddings = await Promise.all(
    textContentBlocks.map(async ({ text }: TextContentBlock) => {
      return await tfState.encoder.embed(text)
    })
  )
  if (textContentBlocks.length < 2) {
    return
  }
  for (let rind = 1; rind < textContentBlocks.length; ++rind) {
    const lind = rind - 1
    const score = tf.cosineDistance(embeddings[lind], embeddings[rind])
    log.debug('Pair', score, textContentBlocks[lind])
  }
  log.debug(
    'Pair',
    textContentBlocks[textContentBlocks.length - 1],
    timer.elapsed()
  )
  return
}

async function findRelevantNodesUsingPlainTextSearch(
  phraseDoc: bm25.WinkDocument,
  storage: StorageApi,
  excludedNids: Set<Nid>,
  cancellationToken: CancellationToken
): Promise<RelevantNode[]> {
  // Let's do a bit of a trick here, using stemmed forms of the words to search:
  // http://snowball.tartarus.org/algorithms/english/stemmer.html
  // If it proves to be working fine, I suggest we even used it for the search
  // in Truthsayer.
  const stems = phraseDoc.tokens().out(wink_.its.stem)
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
      nodesWithScore.push({ node, score: 0 })
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
} {
  let coment: string | undefined = undefined
  const textContentBlocks: TextContentBlock[] = []
  let lines: string[] = [
    patch.extattrs?.title ?? '',
    patch.extattrs?.author ?? '',
  ]
  if (patch.index_text) {
    const { text_blocks, plaintext } = patch.index_text
    if (text_blocks) {
      textContentBlocks.push(...text_blocks)
    } else if (plaintext) {
      textContentBlocks.push({ text: plaintext, type: 'P' })
    }
    lines.push(...textContentBlocks.map(({ text }) => text))
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
  let plaintext = lines.join('.\n').trim()
  if (!plaintext) {
    // Hack: Embedding fails on completely empty string
    plaintext = 'empty'
  }
  return { plaintext, textContentBlocks, coment, extQuote }
}

async function updateNodeIndex(
  storage: StorageApi,
  nid: Nid,
  patch: NodeEventPatch,
  tfState: tf.TfState
): Promise<void> {
  const { plaintext, textContentBlocks, coment, extQuote } =
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
  for (let index = 0; index < textContentBlocks.length; ++index) {
    const { type, text } = textContentBlocks[index]
    if (type === 'H') {
      // FIXME(Alexander)
      continue
    }
    const embedding = await tfState.encoder.embed(text)
    const embeddingJson = tf.tensor2dToJson(embedding)
    const blockKeyStr = nodeBlockKeyToString({ field: 'index-txt', index })
    forBlocks[blockKeyStr] = embeddingJson
  }
  const simsearch: NodeSimilaritySearchInfoLatestVerstion = {
    signature: 'tf-embed-3',
    forBlocks,
  }
  updateNodeFastIndex(nid, simsearch)
  await storage.node.similarity.setIndex({ nid, simsearch })
}

function createNodeEventListener(storage: StorageApi): NodeEventListener {
  return (type: NodeEventType, nid: Nid, patch: NodeEventPatch) => {
    if (type === 'created' || type === 'updated') {
      createTfState().then((tfState: tf.TfState) => {
        updateNodeIndex(storage, nid, patch, tfState).catch((reason) => {
          log.error(
            `Failed to ensure similarity search index integrity for node ${nid}: ${
              errorise(reason).message
            }`
          )
        })
      })
    }
  }
}

async function ensurePerNodeSimSearchIndexIntegrity(
  storage: StorageApi,
  analytics?: BackgroundPosthog | null
): Promise<void> {
  const tfState = await createTfState()
  const nids = await storage.node.getAllNids({})
  for (let ind = 0; ind < nids.length; ++ind) {
    const nid = nids[ind]
    try {
      // Failure to update one index should not interfere with others
      const nodeSimSearchInfo = await storage.node.similarity.getIndex({
        nid,
      })
      if (nodeSimSearchInfo?.signature !== 'tf-embed-3') {
        log.info(
          `Update node similarity index [${ind + 1}/${nids.length}] ${nid}`
        )
        const node = await storage.node.get({ nid })
        await updateNodeIndex(storage, nid, { ...node }, tfState)
      }
    } catch (e) {
      const err = errorise(e)
      const failedTo = `Failed to update similarity search index for node: ${err.message}`
      log.error(failedTo)
      analytics?.capture('error', {
        location: 'background',
        cause: err.message,
        failedTo,
      })
    }
  }
}

export async function register(
  storage: StorageApi,
  analytics?: BackgroundPosthog | null
) {
  const timer = new Timer()
  // Run it as non-blocking async call
  ensurePerNodeSimSearchIndexIntegrity(storage).catch((reason) => {
    const err = errorise(reason)
    const failedTo = `Failed to ensure similarity search index integrity: ${err.message}`
    log.error(failedTo)
    analytics?.capture('error', {
      location: 'background',
      cause: err.message,
      failedTo,
    })
  })

  const nodeEventListener = createNodeEventListener(storage)
  storage.node.addListener(nodeEventListener)
  log.debug('Similarity search module is loaded', timer.elapsedSecondsPretty())
  return () => {
    storage.node.removeListener(nodeEventListener)
  }
}
