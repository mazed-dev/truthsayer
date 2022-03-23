import type { TNode } from 'smuggler-api'
import type { Optional } from 'armoury'

import { TDoc } from '../../editor/types'

import lodash from 'lodash'

export class Beagle {
  allOf: RegExp[]

  constructor(allOf: RegExp[]) {
    this.allOf = allOf
  }

  static fromString(q: string): Beagle {
    const allOf: RegExp[] = _exactPatternsFromString(q)
    return new Beagle(allOf)
  }

  isEmpty(): boolean {
    return this.allOf.length === 0
  }

  searchNode(node: TNode): Optional<TNode> {
    if (this.isEmpty()) {
      // Empty search fall back to show everything
      return node
    }
    const doc = TDoc.fromNodeTextData(node.getText())
    const plaintext = doc.genPlainText()
    const { extattrs, index_text } = node
    const fields: (string | undefined)[] = plaintext
    if (extattrs != null) {
      const { title, description, lang, author, web, content_type } = extattrs
      fields.push(title, description, lang, author, web?.url, content_type)
    }
    if (index_text != null) {
      const { labels, brands, plaintext } = index_text
      fields.push(plaintext, ...labels, ...brands)
    }
    const fieldsToSearchIn: string[] = []
    for (const field of fields) {
      if (field != null) {
        fieldsToSearchIn.push(field)
      }
    }
    return _searchFieldsFor(fieldsToSearchIn, this.allOf) ? node : null
  }
}

export function _searchFieldsFor(
  fields: string[],
  allOfPatterns: RegExp[]
): boolean {
  const allOf = lodash.clone(allOfPatterns)
  fields.forEach((text: string) => {
    // To see a pattern once in node fields is enough, it could be excluded
    // from patterns set after that
    lodash.remove(allOf, (re) => {
      return text.search(re) >= 0
    })
  })
  return allOf.length === 0
}

export function _exactPatternsFromString(q: string): RegExp[] {
  q = lodash.clone(q)
  const allOf: RegExp[] = []
  const exactRe = /"(.*?)"/g
  let exactMatch
  while ((exactMatch = exactRe.exec(q)) !== null) {
    const phrase = exactMatch[1]
    allOf.push(new RegExp(phrase))
  }
  q = q.replace(exactRe, ' ')
  for (const word of q.split(/[.,:;!?\s]/)) {
    const lower = word.toLowerCase().trim()
    if (lower) {
      allOf.push(new RegExp(lower, 'i'))
    }
  }
  return allOf
}
