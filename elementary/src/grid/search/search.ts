import type { TNode, NodeExtattrs } from 'smuggler-api'
import type { Optional } from 'armoury'
import { TDoc } from '../../editor/types'

export class Beagle {
  all: RegExp[]

  constructor(all: RegExp[]) {
    this.all = all
  }

  static fromString(s: string): Beagle {
    const all: RegExp[] = []
    const exactRe = /"(.*?)"/g
    let exactMatch
    while ((exactMatch = exactRe.exec(s)) !== null) {
      const phrase = exactMatch[1]
      all.push(new RegExp(phrase))
    }
    s = s.replace(exactRe, ' ')
    for (const word of s.split(/[.,:;!?\s]/)) {
      const lower = word.toLowerCase().trim()
      if (lower) {
        all.push(new RegExp(lower, 'i'))
      }
    }
    return new Beagle(all)
  }
}

function makePattern(q: string | null): Optional<RegExp> {
  if (q == null || q.length < 1) {
    return null
  }
  // TODO(akindyakov) Use multiline search here
  const flags = true ? '' : 'i'
  return new RegExp(q, flags)
}


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
  const doc = TDoc.fromNodeTextData(node.getText())
  const plaintext = doc.genPlainText()

  const matchFound =
    oneOfElementsMatchesPattern(node.index_text?.labels) ||
    oneOfElementsMatchesPattern(node.index_text?.brands) ||
    matchesPattern(node.index_text?.plaintext) ||
    oneOfElementsMatchesPattern(plaintext) ||
    _extattrsMatchesPattern(pattern, node.extattrs)

  return matchFound ? node : null
}
