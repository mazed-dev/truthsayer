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
  StorageApi,
  TextContentBlock,
  TfEmbeddingForBlockJson,
  NodeSimilaritySearchInfoLatestVerstion,
  NodeBlockKey,
} from 'smuggler-api'
import {
  verifySimilaritySearchInfoVersion,
  nodeBlockKeyToString,
  nodeBlockKeyFromString,
  getNodeBlock,
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
  blockKey: NodeBlockKey
  projection: tf.Tensor2D
}

type FastIndex = {
  dimensions: number[]
  projections: BlockEmbeddingProjection[]
}

type FastResult = {
  nid: Nid
  blockKey: NodeBlockKey
  score: number
}

let _fastIndex: FastIndex | undefined = undefined

async function getFastIndex(
  storage: StorageApi,
  sampleVector: tf.Tensor2D,
): Promise<FastIndex> {
  if (_fastIndex != null) {
    return _fastIndex
  }
  const timer = new Timer()
  const dimensions = tf.sampleDimensions(sampleVector, 42)
  const projections: BlockEmbeddingProjection[] = []
  const allNids = await storage.node.getAllNids({})
  for (const nid of allNids) {
    const nodeSimSearchInfo = verifySimilaritySearchInfoVersion(await storage.node.similarity.getIndex({ nid }))
    if (nodeSimSearchInfo == null) {
      // Skip nodes with invalid index
      log.warning(`Similarity index for node ${nid} is outdated`)
      continue
    }
    const forBlocks = nodeSimSearchInfo.forBlocks
    for (const blockKeyStr in forBlocks) {
      const embeddingJson = forBlocks[blockKeyStr]
      const projection = tf.projectVector(
        tf.tensor2dFromJson(embeddingJson), dimensions)
      const blockKey = nodeBlockKeyFromString(blockKeyStr)
      projections.push({blockKey, nid, projection})
    }
  }
  log.debug('Fast simsearch index craeated', timer.elapsedSecondsPretty())
  _fastIndex = { dimensions, projections, }
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
      tf.tensor2dFromJson(embeddingJson), dimensions)
    const blockKey = nodeBlockKeyFromString(blockKeyStr)
    _fastIndex.projections.push({blockKey, nid, projection})
  }
}

/**
 * The cosine distance threshold below which we call two texts relevant.
 * In data analysis, cosine similarity is a measure of similarity between two
 * non-zero vectors defined in an inner product space. Cosine similarity is the
 * cosine of the angle between the vectors; that is, it is the dot product of
 * the vectors divided by the product of their lengths.
 * https://en.wikipedia.org/wiki/Cosine_similarity
 *
 * Cosine distance is a number that belongs to [0, 1], we can safely assume that
 * all texts with cos between vectors smaller than 0.42 are related. Although,
 * for some texts this similarity measurement might not work, if this is the
 * case consider using euclidean distance insted.
 */
const kSimilarityCosineDistanceThreshold = 0.42

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
  textContentBlocks: TextContentBlock[],
  excludedNids: Set<Nid>,
  cancellationToken: CancellationToken,
  storage: StorageApi,
  _analytics: BackgroundPosthog | null
): Promise<RelevantNode[]> {
  const timer = new Timer()
  throwIfCancelled(cancellationToken)
  const textContentPlainText = textContentBlocks
    .map(({ text }) => text)
    .join('\n')
  const phraseDoc = wink_.readDoc(textContentPlainText)
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
      textContentPlainText,
      textContentBlocks,
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

type RawSimilarityResults = {
  score: number
  nid: Nid
  blockIndex?: number
}

type PatternBlockEmbedding = {
  embedding: tf.Tensor2D
  blockIndex?: number
}

async function findRelevantNodesUsingSimilaritySearch(
  textContentPlainText: string,
  textContentBlocks: TextContentBlock[],
  storage: StorageApi,
  excludedNids: Set<Nid>,
  cancellationToken: CancellationToken
): Promise<RelevantNode[]> {
  const timer = new Timer()
  const tfState = await createTfState()
  // Hack and optimisation
  textContentBlocks = textContentBlocks.filter(
    ({ type, text }: TextContentBlock) => type === 'P' && text.length > 15
  )
  textContentBlocks.push({ text: textContentPlainText, type: 'P' })
  const patterns: PatternBlockEmbedding[] = await Promise.all(
    textContentBlocks.map(async ({ text }: TextContentBlock) => {
      return { embedding: await tfState.encoder.embed(text) }
    })
  )
  log.debug(`Pattern embeddings are calculated [${patterns.length}] in ${timer.elapsedSecondsPretty()}`)
  throwIfCancelled(cancellationToken)
  const fastIndex = await getFastIndex(storage, patterns[0].embedding)
  throwIfCancelled(cancellationToken)
  const fastResults: FastResult[][] = []
  for (const { embedding } of patterns) {
    const projectedPatternEmbedding = tf.projectVector(embedding, fastIndex.dimensions)
    const patternFastResults: FastResult[] = []
    for (const { blockKey, nid, projection } of fastIndex.projections) {
      throwIfCancelled(cancellationToken)
      if (excludedNids.has(nid)) {
        continue
      }
      const score = tf.euclideanDistance(projectedPatternEmbedding, projection)
      if (score < 0.5) {
        patternFastResults.push({blockKey, nid, score})
      }
    }
    patternFastResults.sort((a, b) => b.score - a.score)
    const knownNids: Set<Nid> = new Set()
    // To have each nid no more than once per pattern
    patternFastResults.filter(({nid}) => {
      if (knownNids.has(nid)) {
        return false
      }
      knownNids.add(nid)
      return true
    })
    // 10 Fast Results per patterh
    fastResults.push(patternFastResults.slice(0, 10))
  }
  log.debug(`Fast results are calculated in ${timer.elapsedSecondsPretty()}`, fastResults)
  let rawSimilarityResults: FastResult[] = []
  for (let patternIndex = 0; patternIndex < patterns.length; ++patternIndex) {
    const patternEmbedding = patterns[patternIndex].embedding
    const patternFastResults = fastResults[patternIndex]
    for (const { nid, blockKey } of patternFastResults) {
      throwIfCancelled(cancellationToken)
      const nodeSimSearchInfo = verifySimilaritySearchInfoVersion(await storage.node.similarity.getIndex({ nid }))
      if (nodeSimSearchInfo == null) {
        // Skip nodes with invalid index
        log.warning(`Similarity index for node ${nid} is outdated`)
        continue
      }
      const blockKeyStr = nodeBlockKeyToString(blockKey)
      const embeddingJson = nodeSimSearchInfo.forBlocks[blockKeyStr] ?? null
      if (embeddingJson != null) {
        const embedding = tf.tensor2dFromJson(embeddingJson)
        const score = tf.euclideanDistance(embedding, patternEmbedding)
        if (score < 1) {
          rawSimilarityResults.push({ nid, blockKey, score })
        }
      }
    }
  }
  log.debug(
    'RawSimilarityResults are calculated',
    rawSimilarityResults.length,
    timer.elapsed()
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
  for (const { nid, score, blockKey } of rawSimilarityResults) {
    const node = nodeMap.get(nid)
    if (node == null) {
      log.error(
        `Mazed can't extract node for nid ${nid}, can't use it in similarity search`
      )
      continue
    }
    let matchedPiece: LongestCommonContinuousPiece | undefined = undefined
    const text = getNodeBlock(node, blockKey)
    if (text) {
      matchedPiece = {
        matchTokensCount: 100,
        matchValuableTokensCount: 100,
        match: text,
        prefix: '',
        suffix: '',
      }
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
} {
  let coment: string | undefined = undefined
  let lines: string[] = [
    patch.extattrs?.title ?? '',
    patch.index_text?.plaintext ?? '',
    patch.extattrs?.web_quote?.text ?? '',
    patch.extattrs?.author ?? '',
  ]
  const textContentBlocks: TextContentBlock[] = []
  const indexTextBlocks = patch.index_text?.text_blocks
  if (indexTextBlocks != null) {
    textContentBlocks.push(...indexTextBlocks)
    lines.push(...textContentBlocks.map(({ text }) => text))
  }
  if (patch.text) {
    const doc = TDoc.fromNodeTextData(patch.text)
    const docAsPlaintext = doc.genPlainText()
    lines.push(docAsPlaintext)
    coment = docAsPlaintext
  }
  let plaintext = lines.join('.\n')
  if (!plaintext) {
    // Hack: Embedding fails on completely empty string
    plaintext = 'empty'
  }
  return { plaintext, textContentBlocks, coment }
}

async function updateNodeIndex(
  storage: StorageApi,
  nid: Nid,
  patch: NodeEventPatch,
  tfState: tf.TfState
): Promise<void> {
  const { plaintext, textContentBlocks, coment } = getNodePatchAsString(patch)
  const forBlocks: Record<string, TfEmbeddingJson> = {}
  {
    const embedding = await tfState.encoder.embed(plaintext)
    forBlocks[nodeBlockKeyToString({ field: 'all' })] = tf.tensor2dToJson(embedding)
  }
  if (coment) {
    const embedding = await tfState.encoder.embed(coment)
    forBlocks[nodeBlockKeyToString({ field: 'coment' })] = tf.tensor2dToJson(embedding)
  }
  for (let index = 0; index < textContentBlocks.length; ++index) {
    const { type, text } = textContentBlocks[index]
    if (type === 'H') {
      continue
    }
    const embedding = await tfState.encoder.embed(text)
    const embeddingJson = tf.tensor2dToJson(embedding)
    const blockKeyStr = nodeBlockKeyToString({ field: 'ind_text', index })
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
