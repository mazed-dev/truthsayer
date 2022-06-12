import type { Descendant, BaseEditor } from 'slate'
import { Element } from 'slate'
import { ReactEditor } from 'slate-react'
import { HistoryEditor } from 'slate-history'
import type { NodeTextData } from 'smuggler-api'

import lodash from 'lodash'

export type SlateText = Descendant[]

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
export const kSlateBlockTypeListCheckItem = 'list-check-item' // Deprecated, use 'list-item' with defined 'checked' attribute instead (true/false)
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

export type HeadingElement = {
  type:
    | typeof kSlateBlockTypeH1
    | typeof kSlateBlockTypeH2
    | typeof kSlateBlockTypeH3
    | typeof kSlateBlockTypeH4
    | typeof kSlateBlockTypeH5
    | typeof kSlateBlockTypeH6
  children: CustomText[]
}

export type ThematicBreakElement = {
  type: typeof kSlateBlockTypeBreak
  children: CustomText[]
}

export type CodeBlockElement = {
  type: typeof kSlateBlockTypeCode
  children: CustomText[]
  lang: string | null | undefined
  meta: string | null | undefined
}

export type UnorderedListElement = {
  type: typeof kSlateBlockTypeUnorderedList
  children: Descendant[]
}

export type ParagraphElement = {
  type: typeof kSlateBlockTypeParagraph
  children: CustomText[]
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
  children: CustomText[]
  title?: string
  alt?: string
}

export type DateTimeElement = {
  type: typeof kSlateBlockTypeDateTime
  children: CustomText[] // Do we need this?
  format?: string
  timestamp: number
}

export type LinkElement = {
  type: typeof kSlateBlockTypeLink
  children: CustomText[]
  url: string
  title?: string
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

function isTextSlateBlock(block: Descendant): boolean {
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

function isCheckListBlock(block: Descendant): block is CheckListItemElement {
  if (!Element.isElement(block)) {
    return false
  }
  const { type } = block
  return type === kSlateBlockTypeListCheckItem
}

// A "mark" is how Slate represents rich text formatting which controls text's
// "visual" appearance and is applicable to 'Text' nodes.
// Note that Slate differentiates between "visual" formatting which is done
// via marks and "semantic meaning" formatting (like turning text into a
// bullet-point list, a quote etc.) that is applicable to 'Element' nodes.
// See https://docs.slatejs.org/concepts/09-rendering for more information
export type MarkType =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'code'
  | 'strikeThrough'

export type CustomText = {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  code?: boolean
  strikeThrough?: boolean
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

export type { CustomTypes, Descendant } from 'slate'

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

function getSlateDescendantAsPlainText(node: Descendant): [string[], string[]] {
  const entities: string[] = []
  // @ts-ignore: Property 'text' does not exist on type 'Descendant'
  const texts: string[] = []
  if ('text' in node) {
    texts.push(node.text)
  }
  if ('url' in node) {
    entities.push(node.url)
  }
  if ('title' in node) {
    entities.push(node.title || '')
  }
  if ('alt' in node) {
    entities.push(node.alt || '')
  }
  if ('children' in node) {
    node.children.forEach((item: any) => {
      const [itemText, itemEntities] = getSlateDescendantAsPlainText(item)
      texts.push(...itemText)
      entities.push(...itemEntities)
    })
  }
  return [texts, entities]
}

function getSlateAsPlainText(children: SlateText): string {
  const texts: string[] = []
  const entities: string[] = []
  children.forEach((item) => {
    const [itemTexts, itemEntities] = getSlateDescendantAsPlainText(item)
    texts.push(...itemTexts)
    entities.push(...itemEntities)
  })
  return [...texts, ...entities].join(' ')
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
    // @ts-ignore: Type 'SlateText' is not assignable to type 'CustomText[]'
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

export function makeLeaf(text: string): CustomText {
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

  static fromNodeTextData(text: NodeTextData): TDoc {
    const { slate } = text
    if (slate) {
      return new TDoc(slate as SlateText)
    }
    return this.makeEmpty()
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
          const ret = _truncateTitle(text.join(' '))
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

  genPlainText(): string {
    return getSlateAsPlainText(this.slate)
  }
}
