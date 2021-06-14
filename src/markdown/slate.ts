import { Descendant } from 'slate'
import { serialize } from 'remark-slate'
import unified from 'unified'
import markdown from 'remark-parse'
import slate from 'remark-slate'
import { defaultNodeTypes } from 'remark-slate'

const lodash = require('lodash')

function dbg(...args: Any) {
  console.log('Dbg', ...args) // eslint-disable-line no-console
}

/**
 * Slate object to Markdown:
 * serialize slate state to a markdown string
 */
export function slateToMarkdown(state: Descendant[]): string {
  return state.map((v) => serialize(v)).join('')
}

/**
 * Markdown to Slate object:
 */
export async function markdownToSlate(text): Promise<Descendant[]> {
  let { contents } = await unified().use(markdown).use(slate).process(text)
  contents = parseExtraSyntax(contents)
  dbg('Contents', JSON.stringify(contents, null, 2))
  return contents
}

/**
 * Slate blocks
 */
export const kSlateBlockTypeH1 = defaultNodeTypes.heading[1]
export const kSlateBlockTypeH2 = defaultNodeTypes.heading[2]
export const kSlateBlockTypeH3 = defaultNodeTypes.heading[3]
export const kSlateBlockTypeH4 = defaultNodeTypes.heading[4]
export const kSlateBlockTypeH5 = defaultNodeTypes.heading[5]
export const kSlateBlockTypeH6 = defaultNodeTypes.heading[6]
export const kSlateBlockTypeBreak = defaultNodeTypes.thematic_break
export const kSlateBlockTypeCode = defaultNodeTypes.code_block
export const kSlateBlockTypeOrderedList = defaultNodeTypes.ol_list
export const kSlateBlockTypeParagraph = defaultNodeTypes.paragraph
export const kSlateBlockTypeQuote = defaultNodeTypes.block_quote
export const kSlateBlockTypeUnorderedList = defaultNodeTypes.ul_list
export const kSlateBlockTypeListItem = defaultNodeTypes.listItem

export const kSlateBlockTypeLink = defaultNodeTypes.link
export const kSlateBlockTypeEmphasisMark = defaultNodeTypes.italic
export const kSlateBlockTypeStrongMark = defaultNodeTypes.bold
export const kSlateBlockTypeDeleteMark = defaultNodeTypes.strikeThrough
export const kSlateBlockTypeInlineCodeMark = defaultNodeTypes.code

export const kSlateBlockTypeCheckListItem = 'check-list-item'
export const kSlateBlockTypeDateTime = 'datetime'
/**
 * Implemtations
 * not to be exported
 */
function parseExtraSyntax(content: Descendant[]): Descendant[] {
  const r = content.map((item: Descendant) => {
    let { children, type } = item
    children = children || []
    if (
      type === kSlateBlockTypeOrderedList ||
      type === kSlateBlockTypeUnorderedList
    ) {
      children = parseListExtraSyntax(children)
    } else if (type === kSlateBlockTypeLink) {
      item = parseLinkExtraSyntax(item)
    }
    children = parseExtraSyntax(children)
    return {
      ...item,
      children,
    }
  })
  return r
}

function parseListExtraSyntax(children: Descendant[]): Descendant[] {
  return children.map((item: Descendant) => {
    if (item.type === kSlateBlockTypeListItem) {
      item = convertListItemIfCheck(item)
    }
    return item
  })
}

function convertListItemIfCheck(item: Descendant): Descendant {
  const children: Descendant[] = item.children || []
  const first: Descendant = lodash.head(children)
  if (first) {
    if (first.type === kSlateBlockTypeParagraph) {
      const { text } = lodash.head(first.children || []) || {}
      if (text) {
        const prefix: string = text.slice(0, 4).toLowerCase()
        const isChecked: boolean = prefix === '[x] '
        const isNotChecked: boolean = prefix === '[ ] '
        if (isChecked || isNotChecked) {
          children[0].children[0].text = text.slice(4)
          item = {
            ...item,
            type: kSlateBlockTypeCheckListItem,
            checked: isChecked,
            children,
          }
        }
      }
    }
  }
  return item
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
    dbg('Return date', kSlateBlockTypeDateTime)
    return {
      children,
      format,
      timestamp,
      type: kSlateBlockTypeDateTime,
    }
  }
  return item
}
