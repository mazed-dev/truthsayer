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
} from 'smuggler-api'
import { NodeUtil } from 'smuggler-api'
import { TDoc, Beagle } from 'elementary'
import CancellationToken from 'cancellationtoken'
import { log, errorise } from 'armoury'
import type { BackgroundPosthog } from '../productanalytics'

let tfState: tfUse.TfState | undefined = undefined

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
  cancellationToken.throwIfCancelled()
  const phraseDoc = wink_.readDoc(phrase)
  if (tfState == null) {
    throw new Error('Similarity search state is not initialised')
  }
  let nodesWithScore: NodeWithScore[]
  // Use plaintext search for a small queries, because similarity search based
  // on ML embeddings has a poor quality results on a small texts.
  if (phraseDoc.entities().length() < 4) {
    log.debug(
      'Use Beagle to find relevant nodes, because search phrase is short'
    )
    nodesWithScore = await findRelevantNodesUsingPlainTextSearch(
      phraseDoc,
      storage,
      excludedNids,
      cancellationToken
    )
  } else {
    log.debug('Use tfjs based similarity search to find relevant nodes')
    nodesWithScore = await findRelevantNodesUsingSimilaritySearch(
      phraseDoc,
      storage,
      excludedNids,
      cancellationToken
    )
  }
  const relevantNodes: RelevantNode[] = []
  for (const { node, score } of nodesWithScore) {
    relevantNodes.push({
      node,
      score,
      matchedPiece: findRelevantQuote(phraseDoc, node),
    })
  }
  log.debug('Similarity search results', relevantNodes)
  return relevantNodes
}

type NodeWithScore = {
  score: number
  node: TNode
}

async function findRelevantNodesUsingSimilaritySearch(
  phraseDoc: bm25.WinkDocument,
  storage: StorageApi,
  excludedNids: Set<Nid>,
  cancellationToken: CancellationToken
): Promise<NodeWithScore[]> {
  if (tfState == null) {
    throw new Error('Similarity search state is not initialised')
  }
  const phraseEmbedding = await tfState.encoder.embed(
    phraseDoc.out(wink_.its.normal)
  )
  const allNids = await storage.node.getAllNids({})
  cancellationToken.throwIfCancelled()
  let relevantNids: { score: number; nid: Nid }[] = []
  for (const nid of allNids) {
    if (!!excludedNids.has(nid)) {
      continue
    }
    const nodeSimSearchInfo = await storage.node.similarity.getIndex({
      nid,
    })
    if (
      nodeSimSearchInfo == null ||
      !tfUse.isPerDocIndexUpToDate(
        nodeSimSearchInfo?.signature.algorithm,
        nodeSimSearchInfo?.signature.version
      )
    ) {
      // Skip nodes with invalid index
      log.warning(
        `Similarity index for node ${nid} is invalid "${nodeSimSearchInfo?.signature.algorithm}:${nodeSimSearchInfo?.signature.version}"`
      )
      continue
    }
    const nodeEmbedding = tfUse.tensor2dFromJson(
      nodeSimSearchInfo.embeddingJson
    )
    const score = tfUse.cosineDistance(phraseEmbedding, nodeEmbedding)
    if (score < kSimilarityCosineDistanceThreshold) {
      relevantNids.push({ nid, score })
    }
    cancellationToken.throwIfCancelled()
  }
  // Cut the long tail of results - we can't and we shouldn't show more relevant
  // results than some limit
  relevantNids.sort((ar, br) => ar.score - br.score)
  relevantNids = relevantNids.slice(0, getSuggestionsNumberLimit())
  const nodeMap: Map<Nid, TNode> = new Map()
  {
    const resp = await storage.node.batch.get({
      nids: relevantNids.map(({ nid }) => nid),
    })
    for (const node of resp.nodes) {
      nodeMap.set(node.nid, node)
    }
  }
  const nodesWithScore: NodeWithScore[] = []
  for (const { nid, score } of relevantNids) {
    const node = nodeMap.get(nid)
    if (node == null) {
      log.error(
        `Mazed can't extract node for nid ${nid}, can't use it in similarity search`
      )
      continue
    }
    nodesWithScore.push({ node, score })
  }
  return nodesWithScore
}

async function findRelevantNodesUsingPlainTextSearch(
  phraseDoc: bm25.WinkDocument,
  storage: StorageApi,
  excludedNids: Set<Nid>,
  cancellationToken: CancellationToken
): Promise<NodeWithScore[]> {
  // Let's do a bit of a trick here, using stemmed forms of the words to search:
  // http://snowball.tartarus.org/algorithms/english/stemmer.html
  // If it proves to be working fine, I suggest we even used it for the search
  // in Truthsayer.
  const stems = phraseDoc.tokens().out(wink_.its.stem)
  const beagle = new Beagle(stems)
  const nodesWithScore: NodeWithScore[] = []
  const iter = await storage.node.iterate()
  const expectedLimit = getSuggestionsNumberLimit()
  while (true) {
    cancellationToken.throwIfCancelled()
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

function findRelevantQuote(
  phraseDoc: bm25.WinkDocument,
  node: TNode
): LongestCommonContinuousPiece | undefined {
  if (!NodeUtil.isWebBookmark(node)) {
    return undefined
  }
  const text = [node.index_text?.plaintext ?? node.extattrs?.description]
    .filter((str: string | undefined) => !!str)
    .join(' ')
    .replace(/\s+/g, ' ')
  if (!text) {
    return undefined
  }
  const [overallIndex, perSentenceIndexes] = bm25.createIndex<number>()
  const winkDoc = wink_.readDoc(text)
  const sentences = winkDoc.sentences().out(wink_.its.value)
  for (let ind = 0; ind < sentences.length; ++ind) {
    const sentense = sentences[ind]
    const sentenceInd = bm25.addDocument<number>(
      wink_,
      overallIndex,
      sentense,
      ind
    )
    perSentenceIndexes.push(sentenceInd)
  }
  const relevantIndexes = bm25.findRelevantDocuments<number>(
    wink_,
    phraseDoc,
    1 /* limit */,
    overallIndex,
    perSentenceIndexes
  )
  if (relevantIndexes.length === 0) {
    return undefined
  }
  const relevantSentenceIndex = relevantIndexes[0].docId
  let prefix: string
  let suffix: string
  if (relevantSentenceIndex === 0) {
    prefix = ''
    // If there is no prefix to show, use longer suffix of 3 sentenses to add
    // equal volume of context to the relevant sentense
    suffix = sentences
      .slice(relevantSentenceIndex + 1, relevantSentenceIndex + 4)
      .join(' ')
  } else {
    // Use following 2 sentenses as a suffix
    suffix = sentences
      .slice(relevantSentenceIndex + 1, relevantSentenceIndex + 3)
      .join(' ')
    if (suffix === '' && relevantSentenceIndex > 1) {
      // If there is no suffix to show, use longer prefix
      prefix = sentences
        .slice(relevantSentenceIndex - 2, relevantSentenceIndex)
        .join(' ')
    } else {
      // Use previous sentence as prefix
      prefix = sentences[relevantSentenceIndex - 1]
    }
  }
  return {
    matchTokensCount: 100, // Not released
    matchValuableTokensCount: 100, // Not released
    match: sentences[relevantSentenceIndex],
    prefix,
    suffix,
  }
}

function getNodePatchAsString(patch: NodeEventPatch): string {
  const ret: string[] = [
    patch.extattrs?.title ?? '',
    patch.index_text?.plaintext ?? '',
    patch.extattrs?.web_quote?.text ?? '',
    patch.extattrs?.author ?? '',
  ]
  const text = patch.text
  if (text) {
    const coment = TDoc.fromNodeTextData(text)
    ret.push(coment.genPlainText())
  }
  return ret.join('\n')
}

async function updateNodeIndex(
  storage: StorageApi,
  nid: Nid,
  patch: NodeEventPatch
): Promise<void> {
  if (tfState == null) {
    throw new Error('Similarity search state is not initialised')
  }
  let text = getNodePatchAsString(patch)
  if (!text) {
    // Hack: Embedding fails on completely empty string
    text = 'empty'
  }
  const textWinkDoc = wink_.readDoc(text)
  const embedding = await tfState.encoder.embed(
    textWinkDoc.out(wink_.its.normal)
  )
  const embeddingJson = tfUse.tensor2dToJson(embedding)
  await storage.node.similarity.setIndex({
    nid,
    simsearch: {
      signature: tfUse.getExpectedSignature(),
      embeddingJson,
    },
  })
}

function createNodeEventListener(storage: StorageApi): NodeEventListener {
  return (type: NodeEventType, nid: Nid, patch: NodeEventPatch) => {
    if (type === 'created' || type === 'updated') {
      updateNodeIndex(storage, nid, patch).catch((reason) => {
        log.error(
          `Failed to ensure similarity search index integrity for node ${nid}: ${
            errorise(reason).message
          }`
        )
      })
    }
  }
}

async function ensurePerNodeSimSearchIndexIntegrity(
  storage: StorageApi,
  analytics?: BackgroundPosthog | null
): Promise<void> {
  const nids = await storage.node.getAllNids({})
  for (let ind = 0; ind < nids.length; ++ind) {
    const nid = nids[ind]
    try {
      // Failure to update one index should not interfere with others
      const nodeSimSearchInfo = await storage.node.similarity.getIndex({
        nid,
      })
      if (
        !tfUse.isPerDocIndexUpToDate(
          nodeSimSearchInfo?.signature.algorithm,
          nodeSimSearchInfo?.signature.version
        )
      ) {
        log.info(
          `Update node similarity index [${ind + 1}/${nids.length}] ${nid}`
        )
        const node = await storage.node.get({ nid })
        await updateNodeIndex(storage, nid, { ...node })
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
  if (tfState == null) {
    tfState = await tfUse.createTfState()
  }

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
  log.debug('Similarity search module is loaded')
  return () => {
    storage.node.removeListener(nodeEventListener)
    tfState = undefined
  }
}
