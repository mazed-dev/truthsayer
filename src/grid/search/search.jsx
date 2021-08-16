import { TNode } from '../../smugler/types'
import { getSlateAsPlainText } from '../../doc/doc_util'

import { Optional } from './../../util/types'
import { debug } from './../../util/log'

const lodash = require('lodash')

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
  if (!lodash.isRegExp(pattern)) {
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
  if (!lodash.isRegExp(pattern)) {
    // Empty search fall back to show everything
    return node
  }
  const blocks = getSlateAsPlainText(node.data.getText())
  const matchedIndex = blocks.findIndex((text) => {
    const ret = text.search(pattern) >= 0
    return ret
  })
  if (matchedIndex < 0) {
    return null
  }
  return node
}
