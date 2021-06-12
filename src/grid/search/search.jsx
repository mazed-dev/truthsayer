import { TNode } from '../../smugler/api.js'
import { getDocDraft } from '../../doc/doc_util.jsx'

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
  nodes: Array[TNode],
  pattern: RegExp | null
): Array[TNode] {
  if (!lodash.isRegExp(pattern)) {
    return nodes
  }
  return nodes.filter((node) => {
    return searchNodeFor(node, pattern) != null
  })
}

export function searchNodeFor(
  node: TNode,
  pattern: RegExp | null
): TNode | null {
  if (!lodash.isRegExp(pattern)) {
    // Empty search fall back to show everything
    return node
  }
  const { doc } = node
  if (doc == null) {
    // *dbg*/ console.error('The node is empty', node)
    return null
  }
  const draft = getDocDraft(doc)
  const { blocks } = draft
  if (!blocks) {
    return null
  }
  const matchedIndex = blocks.findIndex((block) => {
    const { text } = block
    const ret = lodash.isString(text) && text.search(pattern) >= 0
    return ret
  })
  if (matchedIndex < 0) {
    return null
  }
  return node
}
