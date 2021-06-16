import { Descendant } from 'slate'
import { serialize } from 'remark-slate'
import unified from 'unified'
import markdown from 'remark-parse'
import slate from 'remark-slate'
import { defaultNodeTypes } from 'remark-slate'

import moment from 'moment'

import {
  kSlateBlockTypeBreak,
  kSlateBlockTypeCode,
  kSlateBlockTypeDateTime,
  kSlateBlockTypeDeleteMark,
  kSlateBlockTypeEmphasisMark,
  kSlateBlockTypeH1,
  kSlateBlockTypeH2,
  kSlateBlockTypeH3,
  kSlateBlockTypeH4,
  kSlateBlockTypeH5,
  kSlateBlockTypeH6,
  kSlateBlockTypeInlineCodeMark,
  kSlateBlockTypeLink,
  kSlateBlockTypeListItem,
  kSlateBlockTypeOrderedList,
  kSlateBlockTypeParagraph,
  kSlateBlockTypeQuote,
  kSlateBlockTypeStrongMark,
  kSlateBlockTypeUnorderedList,
} from '../doc/types'

import { debug } from './../util/log'

const lodash = require('lodash')

/**
 * Slate object to Markdown:
 * serialize slate state to a markdown string
 */
export function slateToMarkdown(state: Descendant[]): string {
  state = serializeExtraBlocks(state)
  return state.map((block) => serialize(block)).join('')
}

/**
 * Markdown to Slate object:
 */
export async function markdownToSlate(text): Promise<Descendant[]> {
  let { contents } = await unified().use(markdown).use(slate).process(text)
  contents = parseExtraBlocks(contents)
  debug('Contents', contents)
  return contents
}

/**
 * Slate blocks
 */

const kMazedBlockTypeToRemarkSlate: Record<string, string> = {
  [kSlateBlockTypeH1]: defaultNodeTypes.heading[1],
  [kSlateBlockTypeH2]: defaultNodeTypes.heading[2],
  [kSlateBlockTypeH3]: defaultNodeTypes.heading[3],
  [kSlateBlockTypeH4]: defaultNodeTypes.heading[4],
  [kSlateBlockTypeH5]: defaultNodeTypes.heading[5],
  [kSlateBlockTypeH6]: defaultNodeTypes.heading[6],
  [kSlateBlockTypeBreak]: defaultNodeTypes.thematic_break,
  [kSlateBlockTypeCode]: defaultNodeTypes.code_block,
  [kSlateBlockTypeOrderedList]: defaultNodeTypes.ol_list,
  [kSlateBlockTypeParagraph]: defaultNodeTypes.paragraph,
  [kSlateBlockTypeQuote]: defaultNodeTypes.block_quote,
  [kSlateBlockTypeUnorderedList]: defaultNodeTypes.ul_list,
  [kSlateBlockTypeListItem]: defaultNodeTypes.listItem,
  [kSlateBlockTypeLink]: defaultNodeTypes.link,
  [kSlateBlockTypeEmphasisMark]: defaultNodeTypes.italic,
  [kSlateBlockTypeStrongMark]: defaultNodeTypes.bold,
  [kSlateBlockTypeDeleteMark]: defaultNodeTypes.strikeThrough,
  [kSlateBlockTypeInlineCodeMark]: defaultNodeTypes.code,
}
const kRemarkSlateBlockTypeToMazed: Record<string, string> = lodash.invert(
  kMazedBlockTypeToRemarkSlate
)

function _mazedBlockTypeToRemarkSlate(type: string): string {
  return kMazedBlockTypeToRemarkSlate[type] || defaultNodeTypes.paragraph
}

function _remarkSlateBlockTypeToMazed(type: string): string {
  debug(
    '_remarkSlateBlockTypeToMazed',
    type,
    kRemarkSlateBlockTypeToMazed[type] || kSlateBlockTypeParagraph
  )
  return kRemarkSlateBlockTypeToMazed[type] || kSlateBlockTypeParagraph
}

/**
 * Implemtations
 * not to be exported
 */
function parseExtraBlocks(content: Descendant[]): Descendant[] {
  return content.map((item: Descendant) => {
    let { type } = item
    if (type) {
      type = _remarkSlateBlockTypeToMazed(type)
    }
    switch (type) {
      case kSlateBlockTypeListItem:
        item = parseListItem(item)
        break
      case kSlateBlockTypeLink:
        item = parseLinkExtraSyntax(item)
        break
    }
    const { children } = item
    if (children) {
      item.children = parseExtraBlocks(children)
    }
    return {
      ...item,
      type,
    }
  })
}

function parseListItem(item: Descendant): Descendant {
  const children: Descendant[] = flattenDescendants(item.children || [])
  debug('flattened', children)
  const first: Descendant = lodash.head(children)
  if (first) {
    const { text, type } = first
    if (text && lodash.isUndefined(type)) {
      const prefix: string = text.slice(0, 4).toLowerCase()
      const isChecked: boolean = prefix === '[x] '
      const isNotChecked: boolean = prefix === '[ ] '
      if (isChecked || isNotChecked) {
        children[0].text = text.slice(4)
        item.checked = isChecked
      }
    }
  }
  item.children = children
  return item
}

/**
 * Make sure there is no nested elements
 */
const _kSlateBlocksToFlatten = new Set([
  kSlateBlockTypeH1,
  kSlateBlockTypeH2,
  kSlateBlockTypeH3,
  kSlateBlockTypeH4,
  kSlateBlockTypeH5,
  kSlateBlockTypeH6,
  kSlateBlockTypeBreak,
  kSlateBlockTypeCode,
  kSlateBlockTypeOrderedList,
  kSlateBlockTypeParagraph,
  kSlateBlockTypeQuote,
  kSlateBlockTypeUnorderedList,
])

function flattenDescendants(elements: Descendant[]): Descendant[] {
  let flattened: Descendant[] = []
  elements.forEach((item: Descendant) => {
    const { type, children, text } = item
    if (_kSlateBlocksToFlatten.has(type)) {
      flattened = lodash.concat(flattened, flattenDescendants(children || []))
    } else {
      flattened.push(item)
    }
  })
  return flattened
}

function parseLinkExtraSyntax(item: Descendant): Descendant {
  const { link, children } = item
  const dtParts = link.match(/^@(-?[0-9]+)\/?(.*)/)
  if (dtParts) {
    // Arguably unix timestamp (signed)
    const timestamp = parseInt(dtParts[1], 10)
    if (isNaN(timestamp)) {
      return item
    }
    let format = dtParts[2]
    if (format === 'day') {
      format = undefined
    }
    return {
      children,
      format,
      timestamp,
      type: kSlateBlockTypeDateTime,
    }
  }
  return item
}

function serializeExtraBlocks(children: Descendant): Descendant {
  return children.map((item: Descendant) => {
    let { children, type } = item
    children = children || []
    if (
      type === kSlateBlockTypeOrderedList ||
      type === kSlateBlockTypeUnorderedList
    ) {
      children = serializeExtraCheckItems(children)
    } else if (type === kSlateBlockTypeDateTime) {
      item = serializeExtraDateTime(item)
    }
    children = parseExtraBlocks(children)
    // TODO
    return {
      ...item,
      children,
    }
  })
}

function serializeExtraCheckItems(children: Descendant[]): Descendant[] {
  return children.map((item: Descendant) => {
    // TODO
    const { type } = item
    if (type === kSlateBlockTypeCheckListItem) {
      item = serializeExtraCheckItem(item)
    }
    return item
  })
}

function serializeExtraCheckItem(item: Descendant): Descendant {
  // TODO
  const { children, checked } = item
  const prefix = checked ? '[x] ' : '[ ] '
  const first: Descendant = lodash.head(children || [])
  if (first && first.type === kSlateBlockTypeParagraph) {
    let { text } = lodash.head(first.children || []) || {}
    text = prefix + (text || '')
    children[0] = { ...first, text }
  } else {
    children.unshift({
      text: `${prefix}:`,
    })
  }
  return {
    type: kSlateBlockTypeListItem,
    children,
  }
}

function serializeExtraDateTime(item: Descendant): Descendant {
  // TODO
  let { children, format, timestamp } = item
  format = format || 'YYYY MMMM DD, dddd, hh:mm'
  const date = moment.unix(timestamp)
  const text = date.format(format)
  return { text }
}
