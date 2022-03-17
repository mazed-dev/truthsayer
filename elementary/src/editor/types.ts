import type { Descendant, BaseEditor } from 'slate'
import { Element } from 'slate'
import { ReactEditor } from 'slate-react'
import { HistoryEditor } from 'slate-history'
import type { NodeTextData } from 'smuggler-api'

import lodash from 'lodash'
import moment from 'moment'

import type { Optional } from 'armoury'

export type SlateText = Descendant[]

enum EChunkType {
  Text = 0,
  Asterisk = 1,
  Empty = 2,
}

export interface TChunk {
  type: EChunkType
  source: string | null
}

export interface TContentBlock {
  key: string
  text: string
  type: string
  characterList: null
  depth: number
  data: Map<any, any>
}

export interface TEntity {}

export interface TDraftDoc {
  blocks: TContentBlock[]
  entityMap: TEntity[]
}

export const kBlockTypeH1 = 'header-one'
export const kBlockTypeH2 = 'header-two'
export const kBlockTypeH3 = 'header-three'
export const kBlockTypeH4 = 'header-four'
export const kBlockTypeH5 = 'header-five'
export const kBlockTypeH6 = 'header-six'
export const kBlockTypeQuote = 'blockquote'
export const kBlockTypeCode = 'code-block'
export const kBlockTypeUnorderedItem = 'unordered-list-item'
export const kBlockTypeOrderedItem = 'ordered-list-item'
export const kBlockTypeUnstyled = 'unstyled'
export const kBlockTypeAtomic = 'atomic'

export const kBlockTypeHrule = 'hrule'
export const kBlockTypeUnorderedCheckItem = 'unordered-check-item'

type BlockType =
  | typeof kBlockTypeH1
  | typeof kBlockTypeH2
  | typeof kBlockTypeH3
  | typeof kBlockTypeH4
  | typeof kBlockTypeH5
  | typeof kBlockTypeH6
  | typeof kBlockTypeQuote
  | typeof kBlockTypeCode
  | typeof kBlockTypeUnorderedItem
  | typeof kBlockTypeOrderedItem
  | typeof kBlockTypeUnstyled
  | typeof kBlockTypeAtomic
  | typeof kBlockTypeHrule
  | typeof kBlockTypeUnorderedCheckItem

export const kEntityTypeLink = 'LINK'
export const kEntityTypeTime = 'DATETIME'
export const kEntityTypeImage = 'IMAGE'

type EntityType =
  | typeof kEntityTypeLink
  | typeof kEntityTypeTime
  | typeof kEntityTypeImage

export const kEntityMutable = 'MUTABLE'
export const kEntityImmutable = 'IMMUTABLE'

type Mutability = typeof kEntityMutable | typeof kEntityImmutable

/**
 * Slate
 * Elements:
 */
export const kSlateBlockTypeH1 = 'heading-one'
export const kSlateBlockTypeH2 = 'heading-two'
export const kSlateBlockTypeH3 = 'heading-three'
export const kSlateBlockTypeH4 = 'heading-four'
export const kSlateBlockTypeH5 = 'heading-five'
export const kSlateBlockTypeH6 = 'heading-six'
export const kSlateBlockTypeBreak = 'thematic-break'
export const kSlateBlockTypeCode = 'code-block'
export const kSlateBlockTypeOrderedList = 'o-list'
export const kSlateBlockTypeParagraph = 'paragraph'
export const kSlateBlockTypeQuote = 'block-quote'
export const kSlateBlockTypeUnorderedList = 'u-list'
export const kSlateBlockTypeListItem = 'list-item'
export const kSlateBlockTypeListCheckItem = 'list-check-item'
export const kSlateBlockTypeImage = 'image'
export const kSlateBlockTypeDateTime = 'datetime'
// [snikitin] Why does link has the same prefix pattern as "marks"?
export const kSlateBlockTypeLink = '-link'

export type CustomElementType =
  | typeof kSlateBlockTypeH1
  | typeof kSlateBlockTypeH2
  | typeof kSlateBlockTypeH3
  | typeof kSlateBlockTypeH4
  | typeof kSlateBlockTypeH5
  | typeof kSlateBlockTypeH6
  | typeof kSlateBlockTypeBreak
  | typeof kSlateBlockTypeCode
  | typeof kSlateBlockTypeOrderedList
  | typeof kSlateBlockTypeParagraph
  | typeof kSlateBlockTypeQuote
  | typeof kSlateBlockTypeUnorderedList
  | typeof kSlateBlockTypeListItem
  | typeof kSlateBlockTypeListCheckItem
  | typeof kSlateBlockTypeImage
  | typeof kSlateBlockTypeDateTime
  | typeof kSlateBlockTypeLink

/**
 * Slate
 * Leafs:
 */
export const kSlateBlockTypeEmphasisMark = '-italic'
export const kSlateBlockTypeStrongMark = '-bold'
export const kSlateBlockTypeDeleteMark = '-strike-through'
export const kSlateBlockTypeInlineCodeMark = '-inline-code'

export function isHeaderBlock(block: any) {
  const { type } = block
  switch (type) {
    case kBlockTypeH1:
    case kBlockTypeH2:
    case kBlockTypeH3:
    case kBlockTypeH4:
    case kBlockTypeH5:
    case kBlockTypeH6:
      return true
  }
  return false
}

// [snikitin] I believe LeafElement should be replaced with CustomText
// as it is a more correct representation of a text element
// (alternatively, as there are files like Leaf.tsx already, perhaps
// CustomText should be renamed as LeafElement instead)
export type LeafElement = {
  text: string
}

export type HeadingElement = {
  type:
    | typeof kSlateBlockTypeH1
    | typeof kSlateBlockTypeH2
    | typeof kSlateBlockTypeH3
    | typeof kSlateBlockTypeH4
    | typeof kSlateBlockTypeH5
    | typeof kSlateBlockTypeH6
  children: LeafElement[]
}

export type ThematicBreakElement = {
  type: typeof kSlateBlockTypeBreak
  children: LeafElement[]
}

export type CodeBlockElement = {
  type: typeof kSlateBlockTypeCode
  children: LeafElement[]
}

export type UnorderedListElement = {
  type: typeof kSlateBlockTypeUnorderedList
  children: Descendant[]
}

export type ParagraphElement = {
  type: typeof kSlateBlockTypeParagraph
  children: LeafElement[]
}

export type BlockQuoteElement = {
  type: typeof kSlateBlockTypeQuote
  children: Descendant[]
}

export type OrderedListElement = {
  type: typeof kSlateBlockTypeOrderedList
  children: Descendant[]
}

export type ListItemElement = {
  type: typeof kSlateBlockTypeListItem
  children: Descendant[]
}

export type CheckListItemElement = {
  type: typeof kSlateBlockTypeListCheckItem
  checked: boolean
  children: Descendant[]
}

export type ImageElement = {
  type: typeof kSlateBlockTypeImage
  url: string
  children: LeafElement[]
}

export type DateTimeElement = {
  type: typeof kSlateBlockTypeDateTime
  children: LeafElement[] // Do we need this?
  format?: string
  timestamp: number
}

export type LinkElement = {
  type: typeof kSlateBlockTypeLink
  children: LeafElement[]
  url: string
  page?: boolean
}

export type CustomElement =
  | HeadingElement
  | ThematicBreakElement
  | UnorderedListElement
  | ParagraphElement
  | CodeBlockElement
  | BlockQuoteElement
  | OrderedListElement
  | ListItemElement
  | CheckListItemElement
  | ImageElement
  | DateTimeElement
  | LinkElement

export function isHeaderSlateBlock(block: Descendant): block is HeadingElement {
  if (!Element.isElement(block)) {
    return false
  }
  const { type } = block
  switch (type) {
    case kSlateBlockTypeH1:
    case kSlateBlockTypeH2:
    case kSlateBlockTypeH3:
    case kSlateBlockTypeH4:
    case kSlateBlockTypeH5:
    case kSlateBlockTypeH6:
      return true
  }
  return false
}

export function isTextSlateBlock(block: Descendant): boolean {
  if (!Element.isElement(block)) {
    return false
  }
  const { type } = block
  switch (type) {
    case kSlateBlockTypeParagraph:
      return true
  }
  return false
}

export function isCheckListBlock(
  block: Descendant
): block is CheckListItemElement {
  if (!Element.isElement(block)) {
    return false
  }
  const { type } = block
  return type === kSlateBlockTypeListCheckItem
}

export function makeHRuleBlock() {
  return {
    type: kBlockTypeHrule,
    key: generateRandomKey(),
    text: '',
    data: {},
    depth: 0,
    entityRanges: [],
    inlineStyleRanges: [],
  }
}

function makeEntity({
  type,
  mutability,
  data,
}: {
  type: EntityType
  mutability: Mutability
  data: any
}) {
  return { type, mutability, data }
}

export function makeLinkEntity(href: any) {
  return makeEntity({
    type: kEntityTypeLink,
    mutability: kEntityMutable,
    data: {
      url: href,
      href,
    },
  })
}

export function makeBlock({
  type,
  key,
  text,
  data,
  depth,
  entityRanges,
  inlineStyleRanges,
}: {
  type: BlockType
  key: string
  text: string
  data: any
  depth: number
  entityRanges: any[]
  inlineStyleRanges: any[]
}) {
  type = type || kBlockTypeUnstyled
  key = key || generateRandomKey()
  text = text || ''
  data = data || {}
  depth = depth || 0
  entityRanges = entityRanges || []
  inlineStyleRanges = inlineStyleRanges || []
  return {
    type,
    key,
    text,
    data,
    depth,
    entityRanges,
    inlineStyleRanges,
  }
}

export function generateRandomKey(): string {
  return Math.random().toString(32).substring(2)
}

// A "mark" is how Slate represents rich text formatting which controls text's
// "visual" appearance and is applicable to 'Text' nodes.
// Note that Slate differentiates between "visual" formatting which is done
// via marks and "semantic meaning" formatting (like turning text into a
// bullet-point list, a quote etc.) that is applicable to 'Element' nodes.
// See https://docs.slatejs.org/concepts/09-rendering for more information
export type MarkType = 'bold' | 'italic' | 'underline' | 'code'

export type CustomText = {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  code?: boolean
  text: string
}

export type CustomEditor = BaseEditor & ReactEditor & HistoryEditor

declare module 'slate' {
  interface CustomTypes {
    Editor: CustomEditor
    Element: CustomElement
    Text: CustomText
  }
}

export type BulletedListElement = {
  type: typeof kSlateBlockTypeUnorderedList
  children: Descendant[]
}

function _truncateTitle(title: string): string {
  title = title.slice(0, 128).replace(/\s+/g, ' ')
  if (title.length > 36) {
    title = title.slice(0, 36)
    return `${title}\u2026`
  } else {
    return title
  }
}

const kDefaultDateFormat: string = 'YYYY MMMM DD, dddd'
const kDefaultTimeFormat: string = 'HH:mm'

const kDefaultCalendarFormat = {
  sameDay: `[Today], ${kDefaultTimeFormat}`,
  nextDay: `[Tomorrow], ${kDefaultTimeFormat}`,
  nextWeek: `dddd, ${kDefaultTimeFormat}`,
  lastDay: `[Yesterday], ${kDefaultTimeFormat}`,
  lastWeek: `[Last] dddd, ${kDefaultTimeFormat}`,
  sameElse: `${kDefaultDateFormat}, ${kDefaultTimeFormat}`,
}

function momentToString(time: moment.Moment, format: Optional<string>): string {
  return format ? time.format(format) : time.calendar(kDefaultCalendarFormat)
}

function unixToString(timestamp: number, format: Optional<string>): string {
  const timeMoment = moment.unix(timestamp)
  return momentToString(timeMoment, format)
}

function getSlateDescendantAsPlainText(parent: Descendant): string[] {
  const entities = []
  // @ts-ignore: Property 'text' does not exist on type 'Descendant'
  let { text } = parent
  // @ts-ignore: Property 'children'/'type'/'link'/... does not exist on type 'Descendant'
  const { children, link, caption, timestamp, format } = parent
  if (link) {
    entities.push(link)
  }
  if (caption) {
    entities.push(caption)
  }
  if (timestamp) {
    entities.push(unixToString(timestamp, format))
  }
  if (children) {
    children.forEach((item: any) => {
      let [itemText, itemEntities] = getSlateDescendantAsPlainText(item)
      itemText = lodash.trim(itemText)
      if (text) {
        text += ' '
        text += itemText
      } else {
        text = itemText
      }
      entities.push(...itemEntities)
    })
  }
  return [text, entities]
}

function getSlateAsPlainText(children: SlateText): string[] {
  const texts: string[] = []
  const entities: string[] = []
  children.forEach((item) => {
    const [text, itemEntities] = getSlateDescendantAsPlainText(item)
    if (text) {
      texts.push(text)
    }
    entities.push(...itemEntities)
  })
  return lodash.concat(texts, entities)
}

function makeThematicBreak(): ThematicBreakElement {
  return {
    type: kSlateBlockTypeBreak,
    children: [makeLeaf('')],
  }
}

export function makeParagraph(children: SlateText): ParagraphElement {
  if (!children) {
    children = [makeLeaf('')]
  }
  return {
    type: kSlateBlockTypeParagraph,
    // @ts-ignore: Type 'SlateText' is not assignable to type 'LeafElement[]'
    children,
  }
}

export function makeLink(text: string, link: string): LinkElement {
  return {
    type: kSlateBlockTypeLink,
    children: [makeLeaf(text)],
    url: link,
  }
}

export function makeNodeLink(text: string, nid: string): LinkElement {
  return {
    type: kSlateBlockTypeLink,
    children: [makeLeaf(text)],
    url: nid,
    page: true,
  }
}

export function makeLeaf(text: string): LeafElement {
  return { text }
}

export function makeDateTime(
  timestamp: number,
  format?: string
): DateTimeElement {
  const type = kSlateBlockTypeDateTime
  return {
    timestamp,
    format,
    type,
    children: [makeLeaf('')],
  }
}

export class TDoc {
  slate: SlateText

  constructor(slate: SlateText) {
    this.slate = slate
  }

  toNodeTextData(): NodeTextData {
    const { slate } = this
    return { slate, draft: null, chunks: null }
  }

  static async fromNodeTextData(text: NodeTextData): Promise<TDoc> {
    const { slate } = text
    if (slate) {
      return new TDoc(slate as SlateText)
    }
    throw Error(`Incorrect text data ${text}`)
  }

  static makeEmpty(): TDoc {
    const text = ''
    const slate = [
      {
        type: kSlateBlockTypeParagraph,
        children: [{ text }],
      },
    ]
    return new TDoc(slate as SlateText)
  }

  makeACopy(nid: string, isBlankCopy: boolean): TDoc {
    let { slate } = this
    const title = this.genTitle()
    let label
    if (isBlankCopy) {
      slate = this.genBlankSlate()
      label = `Blank copy of "${title}"`
    } else {
      slate = lodash.cloneDeep(slate)
      label = `Copy of "${title}"`
    }
    slate.push(makeThematicBreak(), makeParagraph([makeNodeLink(label, nid)]))
    return new TDoc(slate)
  }

  genTitle(): string {
    const title: string | null = this.slate.reduce<string>(
      (acc: string, item: Descendant, _index: number, _array: Descendant[]) => {
        if (
          acc.length === 0 &&
          (isHeaderSlateBlock(item) || isTextSlateBlock(item))
        ) {
          const text = getSlateDescendantAsPlainText(item)[0]
          const ret = _truncateTitle(text)
          if (ret) {
            return ret
          }
        }
        return acc
      },
      ''
    )
    return title || 'Some page\u2026'
  }

  genBlankSlate(): SlateText {
    return this.slate.map((item) => {
      if (isCheckListBlock(item)) {
        item.checked = false
      }
      // @ts-ignore: Property 'children' does not exist on type 'Descendant'
      const { children } = item
      if (lodash.isArray(children)) {
        // @ts-ignore: Property 'children' does not exist on type 'Descendant'
        item.children = blankSlate(children)
      }
      return item
    })
  }

  genPlainText(): string[] {
    return getSlateAsPlainText(this.slate)
  }
}
