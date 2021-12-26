import { TChunk, TDraftDoc, SlateText } from './types'
import { TNode, NodeTextData, makeNodeTextData } from 'smuggler-api'

import { Descendant } from 'slate'
import { unixToString } from './editor/components/DateTime'

import { draftToMarkdown } from '../markdown/draftjs'
import { slateToMarkdown, markdownToSlate } from '../markdown/slate'

import {
  DateTimeElement,
  LeafElement,
  LinkElement,
  ParagraphElement,
  ThematicBreakElement,
  isHeaderSlateBlock,
  isTextSlateBlock,
  isCheckListBlock,
  kSlateBlockTypeBreak,
  kSlateBlockTypeDateTime,
  kSlateBlockTypeLink,
  kSlateBlockTypeParagraph,
} from './types'

import lodash from 'lodash'

export class TDoc {
  slate: SlateText

  constructor(slate: SlateText) {
    this.slate = slate
  }

  toNodeTextData(): NodeTextData {
    const { slate } = this
    return { slate, draft: null, chunks: null }
  }

  static async fromNodeTextData({
    slate,
    draft,
    chunks,
  }: NodeTextData): Promise<TDoc> {
    if (slate) {
      return await makeDoc({ slate: slate as SlateText, draft, chunks })
    }
    return await makeDoc({ slate: undefined, draft, chunks })
  }

  static makeEmpty(): TDoc {
    const { slate } = makeNodeTextData()
    return new TDoc(slate as SlateText)
  }

  makeACopy(nid: string, isBlankCopy: boolean): TDoc {
    let { slate } = this
    const title = exctractDocTitle(slate)
    let label
    if (isBlankCopy) {
      slate = blankSlate(slate)
      label = `Blank copy of "${title}"`
    } else {
      slate = lodash.cloneDeep(slate)
      label = `Copy of "${title}"`
    }
    slate.push(makeThematicBreak(), makeParagraph([makeNodeLink(label, nid)]))
    return new TDoc(slate)
  }
}

export function exctractDocTitle(slate?: SlateText): string {
  let title: string | null = null
  if (slate) {
    title = slate.reduce<string>(
      (acc: string, item: Descendant, _index: number, _array: Descendant[]) => {
        if (
          acc.length === 0 &&
          (isHeaderSlateBlock(item) || isTextSlateBlock(item))
        ) {
          const [text, _] = getSlateDescendantAsPlainText(item)
          const ret = _truncateTitle(text)
          if (ret) {
            return ret
          }
        }
        return acc
      },
      ''
    )
  }
  return title || 'Some page\u2026'
}

function _stripMarkdown(source: string): string {
  return (
    source
      // Replace markdown links with title of the link
      .replace(/\[([^\]]+)\][^\)]+\)/g, '$1')
      .replace(/^[# ]+/, '')
      .replace(/[\[\]]+/, '')
  )
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

function blankSlate(slate: SlateText): SlateText {
  return slate.map((item) => {
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

export async function makeDoc({
  slate,
  chunks,
  draft,
  plain,
}: {
  slate?: SlateText
  chunks?: TChunk[]
  draft?: TDraftDoc
  plain?: string
}): Promise<TDoc> {
  if (slate) {
    return new TDoc(slate)
  }
  if (chunks) {
    const slate = await markdownToSlate(
      chunks
        .map((chunk: any) => {
          return (chunk as TChunk).source
        })
        .join('\n\n')
        .trim()
    )
    return new TDoc(slate)
  }
  if (draft) {
    const slate = await markdownToSlate(draftToMarkdown(draft))
    return new TDoc(slate)
  }
  if (plain) {
    const slate = await markdownToSlate(plain)
    return new TDoc(slate)
  }
  return new TDoc(makeNodeTextData().slate as SlateText)
}

export function getPlainText({ slate, draft, chunks }: NodeTextData): string[] {
  if (slate) {
    return getSlateAsPlainText(slate as SlateText)
  } else if (chunks) {
    return chunks
      .map((item: any) => (item as TChunk).source)
      .filter((source: any) => lodash.isString(source) && source.length > 0)
  } else if (draft) {
    return getDraftAsTextChunks(draft)
  }
  return ['']
}

export function getSlateAsPlainText(children: SlateText): string[] {
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

function getSlateDescendantAsPlainText(parent: Descendant): string[] {
  const entities = []
  // @ts-ignore: Property 'text' does not exist on type 'Descendant'
  let { text } = parent
  // @ts-ignore: Property 'children'/'type'/'link'/... does not exist on type 'Descendant'
  const { children, type, link, caption, timestamp, format } = parent
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

function getDraftAsTextChunks(draft: TDraftDoc): string[] {
  const { blocks, entityMap } = draft
  const texts = blocks
    .map((block) => block.text)
    .filter((text) => lodash.isString(text) && text.length > 0)
  const entities = lodash
    .values(entityMap)
    .map((entity) => {
      // @ts-ignore: Property 'data' does not exist on type 'TEntity'
      const { data } = entity
      const { url, src, alt, tm, format } = data
      if (url) {
        return url
      }
      if (src || alt) {
        return lodash.join([alt || '', src || ''], ' ')
      }
      if (tm) {
        return unixToString(tm, format)
      }
      return null
    })
    .filter((text) => lodash.isString(text) && text.length > 0)
  return lodash.concat(texts, entities)
}

export async function docAsMarkdown(node: TNode): Promise<string> {
  let md = ''
  if (node.isImage()) {
    const source = node.getBlobSource()
    md = md.concat(`![](${source})`)
  }
  const text = node.getText()
  if (text) {
    const doc = await TDoc.fromNodeTextData(text)
    md = md.concat(slateToMarkdown(doc.slate))
  }
  return md
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
