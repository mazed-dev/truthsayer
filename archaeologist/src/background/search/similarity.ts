import lodash from 'lodash'
import { tfUse, loadWinkModel, bm25 } from 'text-information-retrieval'
import type { LongestCommonContinuousPiece } from 'text-information-retrieval'
import type {
  NodeEventType,
  NodeEventPatch,
  NodeEventListener,
  Nid,
  TNode,
  StorageApi,
  TextContentBlock,
  TfEmbeddingForBlockJson,
} from 'smuggler-api'
import { TDoc, Beagle } from 'elementary'
import CancellationToken from 'cancellationtoken'
import { log, errorise, AbortError, Timer } from 'armoury'
import type { BackgroundPosthog } from '../productanalytics'

const wink_ = loadWinkModel()

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
  const textContentPlainText = textContentBlocks.map(({ text }) => text).join('\n')
  const phraseDoc = wink_.readDoc(textContentPlainText)
  // Use plaintext search for a small queries, because similarity search based
  // on ML embeddings has a poor quality results on a small texts.
  const phraseLen = phraseDoc.tokens().length()
  if (phraseLen === 0) {
    throw new Error(
      'Similarity search failed because search phrase is empty string'
    )
  }
  let relevantNodes: RelevantNode[]
  if (phraseLen < 4) {
    log.debug(
      'Use Beagle to find relevant nodes, because search phrase is short',
      phraseLen
    )
    relevantNodes = await findRelevantNodesUsingPlainTextSearch(
      phraseDoc,
      storage,
      excludedNids,
      cancellationToken
    )
  } else {
    log.debug('Use tfjs based similarity search to find relevant nodes')
    relevantNodes = await findRelevantNodesUsingSimilaritySearch(
      textContentPlainText,
      textContentBlocks,
      storage,
      excludedNids,
      cancellationToken
    )
  }
  log.debug('Similarity search results', timer.elapsed(), relevantNodes)
  return relevantNodes
}

type RawSimilarityResults = {
  score: number
  nid: Nid
  blockIndex?: number
}

type PatternBlockEmbedding = {
  embedding: tfUse.Tensor2D
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
  const tfState = await tfUse.createTfState()
  textContentBlocks = textContentBlocks.filter(
    ({ type, text }: TextContentBlock) => type === 'P' && text.length > 15
  )
  textContentBlocks.push({ text: textContentPlainText, type: 'P', })
  const patterns: PatternBlockEmbedding[] = await Promise.all(
      textContentBlocks.map(async ({ text }: TextContentBlock) => {
        return { embedding: await tfState.encoder.embed(text) }
      })
    )
  log.debug('Pattern embeddings are calculated', patterns.length, timer.elapsed())
  const allNids = await storage.node.getAllNids({})
  log.debug('All nids', allNids.length)
  throwIfCancelled(cancellationToken)
  let rawSimilarityResults: RawSimilarityResults[] = []
  for (const nid of allNids) {
    if (!!excludedNids.has(nid)) {
      continue
    }
    const nodeSimSearchInfo = await storage.node.similarity.getIndex({
      nid,
    })
    if (nodeSimSearchInfo?.signature !== 'tf-embed-2') {
      // Skip nodes with invalid index
      log.warning(
        `Similarity index for node ${nid} is invalid "${nodeSimSearchInfo?.signature.algorithm}:${nodeSimSearchInfo?.signature.version}"`
      )
      continue
    }
    const nodeEmbeddings: PatternBlockEmbedding[] = [
      {
        embedding: tfUse.tensor2dFromJson(nodeSimSearchInfo.embeddingJson),
      },
      ...nodeSimSearchInfo.embeddingJsonForBlocks.map(
        ({ index, embeddingJson }) => {
          return {
            embedding: tfUse.tensor2dFromJson(embeddingJson),
            blockIndex: index,
          }
        }
      ),
    ]
    throwIfCancelled(cancellationToken)
    const rawSimilarityResult = calculateNodeSimilarity(
      nid,
      patterns,
      nodeEmbeddings
    )
    if (rawSimilarityResult != null) {
      rawSimilarityResults.push(rawSimilarityResult)
    }
    throwIfCancelled(cancellationToken)
  }
  log.debug('RawSimilarityResults are calculated', rawSimilarityResults.length, timer.elapsed())
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
  for (const { nid, score, blockIndex } of rawSimilarityResults) {
    const node = nodeMap.get(nid)
    if (node == null) {
      log.error(
        `Mazed can't extract node for nid ${nid}, can't use it in similarity search`
      )
      continue
    }
    let matchedPiece: LongestCommonContinuousPiece | undefined = undefined
    if (
      blockIndex != null &&
      node.index_text?.text_blocks != null &&
      blockIndex < node.index_text.text_blocks.length
    ) {
      matchedPiece = {
        matchTokensCount: 100,
        matchValuableTokensCount: 100,
        match: node.index_text.text_blocks[blockIndex].text,
        prefix:
          blockIndex - 1 > 0
            ? node.index_text.text_blocks[blockIndex - 1].text
            : '',
        suffix:
          blockIndex + 1 < node.index_text.text_blocks.length
            ? node.index_text.text_blocks[blockIndex + 1].text
            : '',
      }
    }
    relevantNodes.push({ node, score, matchedPiece })
  }
  return relevantNodes
}

function calculateNodeSimilarity(
  nid: Nid,
  patterns: PatternBlockEmbedding[],
  nodeEmbeddings: PatternBlockEmbedding[]
): RawSimilarityResults | null {
  let minScore: number = kSimilarityCosineDistanceThreshold
  let minScoreForBlockIndex: number = kSimilarityCosineDistanceThreshold
  let blockIndexWithMinScore: number | undefined = undefined
  for (const { embedding: patternEmbedding } of patterns) {
    for (const { embedding: nodeEmbedding, blockIndex } of nodeEmbeddings) {
      const score = tfUse.cosineDistance(patternEmbedding, nodeEmbedding)
      if (score < minScore) {
        minScore = score
      }
      if (blockIndex != null && score < minScoreForBlockIndex) {
        minScoreForBlockIndex = score
        blockIndexWithMinScore = blockIndex
      }
    }
  }
  if (minScore < kSimilarityCosineDistanceThreshold) {
    return { nid, score: minScore, blockIndex: blockIndexWithMinScore }
  }
  return null
}

async function tryToMergeParagraphs(textContentBlocks: TextContentBlock[]): Promise<void> {
  const timer = new Timer()
  const tfState = await tfUse.createTfState()
  const embeddings = await Promise.all(
      textContentBlocks.map(async ({ text }: TextContentBlock) => {
        return await tfState.encoder.embed(text)
      })
    )
  if (textContentBlocks.length < 2) {
    return
  }
  for (let rind = 1; rind < textContentBlocks.length; ++rind) {
    const lind = rind - 1;
    const score = tfUse.cosineDistance(embeddings[lind], embeddings[rind])
    log.debug('Pair', score, textContentBlocks[lind])
  }
  log.debug('Pair', textContentBlocks[textContentBlocks.length - 1], timer.elapsed())
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
} {
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
    const coment = TDoc.fromNodeTextData(patch.text)
    const docAsPlaintext = coment.genPlainText()
    lines.push(docAsPlaintext)
  }
  let plaintext = lines.join('.\n')
  if (!plaintext) {
    // Hack: Embedding fails on completely empty string
    plaintext = 'empty'
  }
  return { plaintext, textContentBlocks }
}

async function updateNodeIndex(
  storage: StorageApi,
  nid: Nid,
  patch: NodeEventPatch,
  tfState: tfUse.TfState,
): Promise<void> {
  const { plaintext, textContentBlocks } = getNodePatchAsString(patch)
  const textWinkDoc = wink_.readDoc(plaintext)
  const embedding = await tfState.encoder.embed(
    textWinkDoc.out(wink_.its.normal)
  )
  const embeddingJson = tfUse.tensor2dToJson(embedding)
  const embeddingJsonForBlocksPromises: Promise<TfEmbeddingForBlockJson>[] = []
  for (let index = 0; index < textContentBlocks.length; ++index) {
    const { type, text } = textContentBlocks[index]
    if (type === 'H') {
      continue
    }
    const textWinkDoc = wink_.readDoc(text)
    if (textWinkDoc.tokens().length() < 4) {
      continue
    }
    const callable = async (): Promise<TfEmbeddingForBlockJson> => {
      if (tfState == null) {
        throw new Error('Similarity search state is not initialised')
      }
      const embedding = await tfState.encoder.embed(
        textWinkDoc.out(wink_.its.normal)
      )
      const embeddingJson = tfUse.tensor2dToJson(embedding)
      return { index, embeddingJson }
    }
    embeddingJsonForBlocksPromises.push(callable())
  }
  await storage.node.similarity.setIndex({
    nid,
    simsearch: {
      signature: 'tf-embed-2',
      embeddingJson,
      embeddingJsonForBlocks: await Promise.all(embeddingJsonForBlocksPromises),
    },
  })
}

function createNodeEventListener(storage: StorageApi): NodeEventListener {
  return (type: NodeEventType, nid: Nid, patch: NodeEventPatch) => {
    if (type === 'created' || type === 'updated') {
      tfUse.createTfState().then((tfState: tfUse.TfState) => {
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
  const tfState = await tfUse.createTfState()
  const nids = await storage.node.getAllNids({})
  for (let ind = 0; ind < nids.length; ++ind) {
    const nid = nids[ind]
    try {
      // Failure to update one index should not interfere with others
      const nodeSimSearchInfo = await storage.node.similarity.getIndex({
        nid,
      })
      if (nodeSimSearchInfo?.signature !== 'tf-embed-2') {
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
  log.debug('Similarity search module is loaded', timer.elapsed())
  return () => {
    storage.node.removeListener(nodeEventListener)
  }
}
