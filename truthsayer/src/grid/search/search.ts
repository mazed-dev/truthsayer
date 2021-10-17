import { TNode } from 'smuggler-api'
import { getSlateAsPlainText } from '../../doc/doc_util'

import { Optional } from './../../util/types'
import { debug } from './../../util/log'

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
  const blocks = getSlateAsPlainText(node.getText().getText())
  const matchedIndex = blocks.findIndex((text) => {
    const ret = text.search(pattern) >= 0
    return ret
  })
  if (matchedIndex < 0) {
    return null
  }
  return node
}
