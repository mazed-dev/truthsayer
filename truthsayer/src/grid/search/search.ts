import { TNode } from 'smuggler-api'
import { getPlainText } from '../../doc/doc_util'
import { Optional } from './../../util/types'

/**
    nid: nid,
    doc: doc,
    created_at: moment(res.headers[kHeaderCreatedAt]),
    updated_at: moment(res.headers[kHeaderLastModified]),
    attrs: null,
    meta: meta,
    secret_id: secret_id,
    success: success,
  */
export function searchNodesFor(
  nodes: TNode[],
  pattern: RegExp | null
): TNode[] {
  if (!pattern) {
    return nodes
  }
  return nodes.filter((node) => {
    return searchNodeFor(node, pattern) != null
  })
}

export function searchNodeFor(
  node: TNode,
  pattern: Optional<RegExp>
): Optional<TNode> {
  if (!pattern) {
    // Empty search fall back to show everything
    return node
  }
  const matchesPattern = (index_element: Optional<string> | undefined) => {
    return index_element && index_element.search(pattern) >= 0
  }
  const oneOfElementsMatchesPattern = (search_index: string[] | undefined) => {
    return (
      search_index !== undefined && search_index.findIndex(matchesPattern) >= 0
    )
  }

  const matchFound =
    oneOfElementsMatchesPattern(node.index_text?.labels) ||
    oneOfElementsMatchesPattern(node.index_text?.brands) ||
    matchesPattern(node.index_text?.plaintext) ||
    oneOfElementsMatchesPattern(getPlainText(node.getText()))

  return matchFound ? node : null
}
