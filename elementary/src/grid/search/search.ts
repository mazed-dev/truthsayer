import type { TNode, NodeExtattrs } from 'smuggler-api'
import type { Optional } from 'armoury'
import { TDoc, SlateText } from '../../editor/types'

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

export function _matchesPattern(
  pattern: RegExp,
  field?: string | null
): boolean {
  return field != null && field.search(pattern) >= 0
}

export function _extattrsMatchesPattern(
  pattern: RegExp,
  extattrs: NodeExtattrs | null | undefined
): boolean {
  if (extattrs == null) {
    return false
  }
  return (
    _matchesPattern(pattern, extattrs.title) ||
    _matchesPattern(pattern, extattrs.description) ||
    _matchesPattern(pattern, extattrs.lang) ||
    _matchesPattern(pattern, extattrs.author) ||
    _matchesPattern(pattern, extattrs.web?.url) ||
    _matchesPattern(pattern, extattrs.content_type)
  )
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
    return _matchesPattern(pattern, index_element)
  }
  const oneOfElementsMatchesPattern = (search_index: string[] | undefined) => {
    return (
      search_index !== undefined && search_index.findIndex(matchesPattern) >= 0
    )
  }
  const { slate } = node.getText()
  if (slate == null) {
    throw Error(`Obsolete document type detected${node.getText()}`)
  }
  const doc = new TDoc(slate as SlateText)
  const plaintext = doc.genPlainText()

  const matchFound =
    oneOfElementsMatchesPattern(node.index_text?.labels) ||
    oneOfElementsMatchesPattern(node.index_text?.brands) ||
    matchesPattern(node.index_text?.plaintext) ||
    oneOfElementsMatchesPattern(plaintext) ||
    _extattrsMatchesPattern(pattern, node.extattrs)

  return matchFound ? node : null
}
