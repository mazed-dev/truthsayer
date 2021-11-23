import { TNode } from 'smuggler-api'
import { getPlainText } from '../../doc/doc_util'

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
  const labelIndex = node.index_text?.labels.findIndex((text) => {
    return text.search(pattern) >= 0
  })
  if (labelIndex !== undefined && labelIndex >= 0) {
    return node
  }

  const blocks = getPlainText(node.getText())
  const matchedIndex = blocks.findIndex((text) => {
    const ret = text.search(pattern) >= 0
    return ret
  })
  if (matchedIndex < 0) {
    return null
  }
  return node
}
