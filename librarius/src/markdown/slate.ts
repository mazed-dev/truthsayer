import type { Descendant } from 'slate'
import { serialize } from 'remark-slate'
import { unified } from 'unified'
import { TNode } from 'smuggler-api'
import markdown from 'remark-parse'
import slate from 'remark-slate'
import { defaultNodeTypes } from 'remark-slate'

import moment from 'moment'

import {
  TDoc,
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
  kSlateBlockTypeImage,
  kSlateBlockTypeListItem,
  kSlateBlockTypeListCheckItem,
  kSlateBlockTypeOrderedList,
  kSlateBlockTypeParagraph,
  kSlateBlockTypeQuote,
  kSlateBlockTypeStrongMark,
  kSlateBlockTypeUnorderedList,
  Descendant,
} from 'elementary'

import lodash from 'lodash'

/**
 * Slate object to Markdown:
 * serialize slate state to a markdown string
 */
export function slateToMarkdown(state: Descendant[]): string {
  state = serializeExtraBlocks(lodash.cloneDeep(state))
  return state.map((block) => serialize(block)).join('')
}

/**
 * Markdown to Slate object:
 */
export async function markdownToSlate(text: string): Promise<Descendant[]> {
  const vf = await unified().use(markdown).use(slate).process(text)
  let contents = vf.result as Descendant[]
  contents = parseExtraBlocks(contents)
  contents = _siftUpBlocks(contents)
  contents = _dissolveNestedParagraphs(contents)
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
  [kSlateBlockTypeImage]: defaultNodeTypes.image,
  [kSlateBlockTypeEmphasisMark]: defaultNodeTypes.emphasis_mark,
  [kSlateBlockTypeStrongMark]: defaultNodeTypes.strong_mark,
  [kSlateBlockTypeDeleteMark]: defaultNodeTypes.delete_mark,
  [kSlateBlockTypeInlineCodeMark]: defaultNodeTypes.inline_code_mark,
}
const kRemarkSlateBlockTypeToMazed: Record<string, string> = lodash.invert(
  kMazedBlockTypeToRemarkSlate
)

function _mazedBlockTypeToRemarkSlate(type: string): string {
  return kMazedBlockTypeToRemarkSlate[type] || defaultNodeTypes.paragraph
}

function _remarkSlateBlockTypeToMazed(type: string): string {
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
      item.type = type
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
    return item
  })
}

function parseListItem(item: Descendant): Descendant {
  const children: Descendant[] = flattenDescendants(item.children || [])
  const first: Descendant = children[0]
  if (first) {
    const { text, type } = first
    if (text && type == null) {
      const prefix: string = text.slice(0, 4).toLowerCase()
      const isChecked: boolean = prefix === '[x] '
      const isNotChecked: boolean = prefix === '[ ] '
      if (isChecked || isNotChecked) {
        children[0].text = text.slice(4)
        item.type = kSlateBlockTypeListCheckItem
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
  kSlateBlockTypeBreak,
  kSlateBlockTypeCode,
  kSlateBlockTypeH1,
  kSlateBlockTypeH2,
  kSlateBlockTypeH3,
  kSlateBlockTypeH4,
  kSlateBlockTypeH5,
  kSlateBlockTypeH6,
  kSlateBlockTypeImage,
  kSlateBlockTypeParagraph,
  kSlateBlockTypeQuote,
])

function flattenDescendants(elements: Descendant[]): Descendant[] {
  let flattened: Descendant[] = []
  elements.forEach((item: Descendant) => {
    const { type, children } = item
    if (_kSlateBlocksToFlatten.has(type)) {
      flattened = flattened.concat(flattenDescendants(children || []))
    } else {
      flattened.push(item)
    }
  })
  return flattened
}

function parseLinkExtraSyntax(item: Descendant): Descendant {
  let { link, children } = item
  const dtParts = link.match(/^@(-?[0-9]+)\/?(.*)/)
  if (dtParts) {
    // Arguably unix timestamp (signed)
    const timestamp = parseInt(dtParts[1], 10)
    if (!isNaN(timestamp)) {
      let format = dtParts[2]
      // Backward compatibility
      if (format === 'day') {
        format = 'YYYY MMMM DD, dddd'
      } else if (format === 'time') {
        format = 'YYYY MMMM DD, hh:mm:ss'
      }
      format = format || 'YYYY MMMM DD, dddd, hh:mm'
      const text = moment.unix(timestamp).format(format)
      children = [{ text }]
      return {
        children,
        format,
        timestamp,
        type: kSlateBlockTypeDateTime,
      }
    }
  }
  item.url = link
  return item
}

export function _dissolveNestedParagraphs(
  contents: Descendant[]
): Descendant[] {
  const newContents: Descendant[] = []
  contents.forEach((item) => {
    const { children } = item
    if (lodash.isArray(children)) {
      item.children = _dissolveNestedParagraphsRec(children)
    }
    newContents.push(item)
  })
  return newContents
}

function _dissolveNestedParagraphsRec(contents: Descendant[]): Descendant[] {
  const newContents: Descendant[] = []
  contents.forEach((item) => {
    const { type, children } = item
    if (type === kSlateBlockTypeParagraph) {
      newContents.push(...children)
    } else {
      newContents.push(item)
    }
  })
  return newContents
}

export function _siftUpBlocks(contents: Descendant[]): Descendant[] {
  const newContents: Descendant[] = []
  contents.forEach((item) => {
    const { children } = item
    if (lodash.isArray(children)) {
      const [topChildren, newChildren] = _siftUpBlocksRec(children)
      newContents.push(...topChildren)
      // We can't leave empty element and we can't just delete it, let's add one
      // empty text node to make it valid for Slate
      if (newChildren.length === 0) {
        newChildren.push({ text: '' })
      }
      item.children = newChildren
    }
    newContents.push(item)
  })
  return newContents
}

function _siftUpBlocksRec(content: Descendant[]): [Descendant[], Descendant[]] {
  const tops: Descendant[] = []
  content = content
    .map((item: Descendant) => {
      const { type, children } = item
      if (
        _kSlateBlocksToFlatten.has(type) &&
        type !== kSlateBlockTypeParagraph
      ) {
        tops.push(item)
        return null
      }
      if (children) {
        const [topChildren, itemChildren] = _siftUpBlocksRec(children)
        tops.push(...topChildren)
        item.children = itemChildren
      }
      return item
    })
    .filter((item) => item != null)
  return [tops, content]
}

function serializeExtraBlocks(children: Descendant[]): Descendant[] {
  return children.map((item: Descendant) => {
    switch (item.type) {
      case kSlateBlockTypeListCheckItem:
        item = serializeExtraListCheckItem(item)
        break
      case kSlateBlockTypeDateTime:
        item = serializeExtraDateTime(item)
        break
      case kSlateBlockTypeLink:
        item = serializeExtraLink(item)
        break
      case kSlateBlockTypeListItem:
        item = hackListItemSerialisation(item)
        break
    }
    let { children, type } = item
    if (children) {
      children = serializeExtraBlocks(children)
    }
    if (type) {
      type = _mazedBlockTypeToRemarkSlate(type)
    }
    return { ...item, children, type }
  })
}

function hackListItemSerialisation(item: Descendant): Descendant {
  const { children } = item
  const lastChild: Descendant = lodash.last(children || [])
  if (lastChild?.text?.endsWith('\n')) {
    // nothing
  } else {
    children.push({
      text: '\n',
    })
  }
  return {
    ...item,
    children,
  }
}

function serializeExtraListCheckItem(item: Descendant): Descendant {
  const { children, checked } = item
  let prefix = checked ? '[x]' : '[ ]'
  const first: Descendant | undefined = children ? children[0] : undefined
  if (first && first.text && first.text.startsWith(' ')) {
    // nothing
  } else {
    prefix = prefix.concat(' ')
  }
  children.unshift({
    text: prefix,
  })
  return {
    type: kSlateBlockTypeListItem,
    children: [
      {
        type: kSlateBlockTypeParagraph,
        children,
      },
    ],
  }
}

function serializeExtraLink(item: Descendant): Descendant {
  const { url, link } = item
  return {
    ...item,
    link: url || link,
  }
}

function serializeExtraDateTime(item: Descendant): Descendant {
  let { children, format, timestamp } = item
  format = format || 'YYYY MMMM DD, dddd, hh:mm:ss'
  const date = moment.unix(timestamp)
  const text = date.format(format)
  return { text, children }
}

export async function nodeToMarkdown(node: TNode): Promise<string> {
  let md = ''
  if (node.isImage()) {
    const source = node.getBlobSource()
    md = md.concat(`![](${source})`)
  }
  const text = node.getText()
  if (text) {
    const doc = TDoc.fromNodeTextData(text)
    md = md.concat(slateToMarkdown(doc.slate))
  }
  return md
}
