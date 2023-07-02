import type {
  TNode,
  NodeBlockKey,
  NodeEventPatch,
  TextContentBlock,
} from 'smuggler-api'
import type { Optional } from 'armoury'
import { log } from 'armoury'

import { TDoc } from '../../editor/types'

import lodash from 'lodash'

export type Woof = {
  matchedQuote?: NodeBlockKey
}

export class Beagle {
  allOf: string[]

  constructor(allOf: string[]) {
    this.allOf = allOf
  }

  static fromString(q?: string): Beagle {
    if (q == null) {
      return new Beagle([])
    }
    return new Beagle(_exactPatternsFromString(q))
  }

  isEmpty(): boolean {
    return this.allOf.length === 0
  }

  searchNode(node: TNode): Optional<Woof> {
    if (this.isEmpty()) {
      // Empty search fall back to show everything
      return {}
    }
    const fields = getNodeSearchableIndex(node)
    for (const { key, text } of fields) {
      if (key.field === '*') {
        // `*` field just includes all known fields of a node, no need to search
        // in it again
        continue
      }
      if (_searchFieldFor(text, this.allOf)) {
        return { matchedQuote: key }
      }
    }
    return null
  }
}

export function _searchFieldFor(
  text: string[],
  allOfPatterns: string[]
): boolean {
  const allOf = lodash.clone(allOfPatterns)
  text.forEach((text: string) => {
    // To see a pattern once in node fields is enough, it could be excluded
    // from patterns set after that
    const lower = text.toLowerCase()
    lodash.remove(allOf, (pattern) => {
      return lower.indexOf(pattern) >= 0
    })
  })
  return allOf.length === 0
}

export function _exactPatternsFromString(q: string): string[] {
  q = lodash.clone(q)
  const allOf: string[] = []
  const exactRe = /"(.*?)"/g
  let exactMatch
  while ((exactMatch = exactRe.exec(q)) !== null) {
    const phrase = exactMatch[1]
    allOf.push(phrase.toLowerCase())
  }
  q = q.replace(exactRe, ' ')
  for (const word of q.split(/[.,:;!?\s]/)) {
    const lower = word.toLowerCase().trim()
    if (lower) {
      allOf.push(lower)
    }
  }
  return allOf
}

export function getNodeSearchableFields({
  text,
  index_text,
  extattrs,
}: NodeEventPatch | TNode): {
  plaintext: string[]
  textContentBlocks: TextContentBlock[]
  attrs: string[]
  coment?: string
  extQuote?: string
} {
  let coment: string | undefined = undefined
  const textContentBlocks: TextContentBlock[] = []
  const attrs: string[] = [
    extattrs?.title ?? '',
    extattrs?.author ?? '',
    extattrs?.web?.url ?? '',
    extattrs?.web_quote?.url ?? '',
  ].filter((v) => !!v)
  const plaintext: string[] = [...attrs]
  if (extattrs?.web?.text) {
    textContentBlocks.push(...extattrs?.web?.text.blocks)
    plaintext.push(...textContentBlocks.map(({ text }) => text))
  }
  if (index_text?.plaintext) {
    // textContentBlocks.push({ text: index_text?.plaintext, type: 'P' })
    const indexPlaintext = index_text?.plaintext
    if (indexPlaintext) {
      plaintext.push(indexPlaintext)
    }
  }
  if (text) {
    const doc = TDoc.fromNodeTextData(text)
    const docAsPlaintext = doc.genPlainText()
    plaintext.push(docAsPlaintext)
    coment = docAsPlaintext
  }
  const extQuote = extattrs?.web_quote?.text ?? undefined
  if (extQuote) {
    plaintext.push(extQuote)
  }
  return {
    plaintext,
    textContentBlocks,
    attrs,
    coment,
    extQuote,
  }
}

export function getNodeSearchableIndex(node: NodeEventPatch | TNode): {
  key: NodeBlockKey
  text: string[]
}[] {
  const { textContentBlocks, plaintext, attrs, coment, extQuote } =
    getNodeSearchableFields(node)
  const ret = textContentBlocks.map(({ text }, index) => {
    return {
      key: { field: 'web-text', index } as NodeBlockKey,
      text: [text],
    }
  })
  if (plaintext) {
    ret.push({ key: { field: '*' }, text: plaintext })
  }
  if (attrs) {
    ret.push({ key: { field: 'attrs' }, text: attrs })
  }
  if (coment) {
    ret.push({ key: { field: 'text' }, text: [coment] })
  }
  if (extQuote) {
    ret.push({ key: { field: 'web-quote' }, text: [extQuote] })
  }
  return ret
}
