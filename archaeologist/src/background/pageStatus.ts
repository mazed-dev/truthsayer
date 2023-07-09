import { log } from 'armoury'
import type { StorageApi, TNode } from 'smuggler-api'
import { NodeUtil, steroid } from 'smuggler-api'
import { isMemorable } from '../content/extractor/url/unmemorable'

export async function requestPageSavedStatus(
  storage: StorageApi,
  url: string | undefined
): Promise<{
  bookmark?: TNode
  unmemorable?: boolean
}> {
  if (url == null) {
    return { unmemorable: false }
  }
  if (!isMemorable(url)) {
    return { unmemorable: true }
  }
  let nodes
  try {
    nodes = await steroid(storage).node.lookup({ url })
  } catch (err) {
    log.debug('Lookup by origin ID failed, consider page as non saved', err)
    return { unmemorable: false }
  }
  let bookmark: TNode | undefined = undefined
  for (const node of nodes) {
    if (NodeUtil.isWebBookmark(node)) {
      bookmark = node
      break
    }
  }
  return { bookmark }
}

export async function requestPageSavedStatusWithConnections(
  storage: StorageApi,
  url: string | undefined
): Promise<{
  bookmark?: TNode
  fromNodes?: TNode[]
  toNodes?: TNode[]
  unmemorable?: boolean
}> {
  const { bookmark, unmemorable } = await requestPageSavedStatus(storage, url)
  if (unmemorable) {
    return { unmemorable }
  }
  const { fromNodes, toNodes } = await requestPageConnections(storage, bookmark)
  return { bookmark, fromNodes, toNodes }
}

async function requestPageConnections(storage: StorageApi, bookmark?: TNode) {
  let fromNodes: TNode[] = []
  let toNodes: TNode[] = []
  if (bookmark == null) {
    return { fromNodes, toNodes }
  }
  try {
    // Fetch all edges for a given node
    const { from_edges: fromEdges, to_edges: toEdges } = await storage.edge.get(
      { nid: bookmark.nid }
    )
    // Gather node IDs of neighbour nodes to reqeust them
    const nids = fromEdges
      .map((edge) => edge.from_nid)
      .concat(toEdges.map((edge) => edge.to_nid))
    const { nodes } = await storage.node.batch.get({ nids })
    // Sort neighbour nodes out
    fromNodes = nodes.filter(
      (node) => fromEdges.findIndex((edge) => edge.from_nid === node.nid) !== -1
    )
    toNodes = nodes.filter(
      (node) => toEdges.findIndex((edge) => edge.to_nid === node.nid) !== -1
    )
  } catch (err) {
    log.debug(`Loading of node ${bookmark.nid} connections failed with`, err)
  }
  return { fromNodes, toNodes }
}
