import type { TNode } from 'smuggler-api'
import type { Optional } from 'armoury'
import { log } from 'armoury'

import { TDoc } from '../../editor/types'

import lodash from 'lodash'

export type Woof = {}

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
    const doc = TDoc.fromNodeTextData(node.text)
    const plaintext = doc.genPlainText()
    const { extattrs, index_text } = node
    const fields: (string | undefined)[] = [plaintext]
    if (extattrs != null) {
      const { title, description, lang, author, content_type, web, web_quote } =
        extattrs
      fields.push(
        title,
        description,
        lang,
        author,
        content_type,
        web?.url,
        web_quote?.url,
        web_quote?.text
      )
      const webPageText = web?.text?.blocks
      if (webPageText != null) {
        log.debug('Web page has some text', webPageText)
        fields.push(...webPageText.map(({ text }) => text))
      }
    }
    if (index_text != null) {
      const { labels, brands, plaintext } = index_text
      fields.push(plaintext, ...labels, ...brands)
    }
    const fieldsToSearchIn: string[] = []
    for (const field of fields) {
      if (field) {
        fieldsToSearchIn.push(field)
      }
    }
    return _searchFieldsFor(fieldsToSearchIn, this.allOf) ? {} : null
  }
}

export function _searchFieldsFor(
  fields: string[],
  allOfPatterns: string[]
): boolean {
  const allOf = lodash.clone(allOfPatterns)
  fields.forEach((text: string) => {
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
