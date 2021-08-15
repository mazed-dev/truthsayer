import { TDoc, TChunk, EChunkType } from './types.ts'

import { cloneDeep } from 'lodash'

import {
  makeChunk,
  makeHRuleChunk,
  makeAsteriskChunk,
  isHeaderChunk,
  isTextChunk,
  makeBlankCopyOfAChunk,
} from './chunk_util.jsx'

import { unixToString } from './editor/components/DateTime'

import { debug } from './../util/log'
import { genEmoji } from './../lib/EmojiDefaultAsterisk'

import { draftToMarkdown, markdownToDraft } from '../markdown/conv.jsx'
import { slateToMarkdown, markdownToSlate } from '../markdown/slate.ts'

import {
  DateTimeElement,
  LeafElement,
  LinkElement,
  ParagraphElement,
  ThematicBreakElement,
  addLinkBlock,
  isHeaderBlock,
  isHeaderSlateBlock,
  isTextSlateBlock,
  kSlateBlockTypeBreak,
  kSlateBlockTypeDateTime,
  kSlateBlockTypeH1,
  kSlateBlockTypeLink,
  kSlateBlockTypeListCheckItem,
  kSlateBlockTypeParagraph,
  makeHRuleBlock,
  makeUnstyledBlock,
} from './types.ts'

const lodash = require('lodash')

export function exctractDocTitle(slate: Descendant[]): string {
  const title = slate.reduce((acc, item) => {
    if (!acc && (isHeaderSlateBlock(item) || isTextSlateBlock(item))) {
      const [text, _] = getSlateDescendantAsPlainText(item)
      const title = _truncateTitle(text)
      if (title) {
        return title
      }
    }
    return acc
  }, null)
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

function blankSlate(slate: Descendant[]): Descendant[] {
  return slate.map((item) => {
    const { type, children } = item
    if (type === kSlateBlockTypeListCheckItem) {
      item.checked = false
    }
    if (lodash.isArray(children)) {
      item.children = blankSlate(children)
    }
    return item
  })
}

export async function makeACopy(
  doc: TDoc | string,
  nid: string,
  isBlankCopy: boolean
): TDoc {
  let slate = await getDocSlate(doc)
  const title = exctractDocTitle(slate)
  let label
  if (isBlankCopy) {
    slate = blankSlate(slate)
    const title = exctractDocTitle(slate)
    label = `Blank copy of "${title}"`
  } else {
    label = `Copy of "${title}"`
  }
  slate.push(makeThematicBreak(), makeParagraph([makeLink(label, nid)]))
  return { slate }
}

// Deprecated
export function extractDocAsMarkdown(doc: TDoc): string {
  if (lodash.isString(doc)) {
    return doc
  }
  return doc.chunks
    .reduce((acc, current) => {
      return `${acc}\n\n${current.source}`
    }, '')
    .trim()
}

// Deprecated
export async function enforceTopHeader(doc: TDoc): TDoc {
  if (lodash.isString(doc)) {
    const slate = await markdownToSlate(doc)
    doc = await makeDoc({ slate })
  }
  const chunks = doc.chunks || []
  if (chunks.length === 0 || !isHeaderChunk(doc.chunks[0])) {
    chunks.unshift(makeAsteriskChunk())
  }
  doc.chunks = chunks
  return doc
}

export async function makeDoc(args): TDoc {
  if (!args) {
    return { slate: makeEmptySlate() }
  }
  let { chunks, draft, slate } = args || {}
  if (slate) {
    return { slate }
  }
  if (chunks) {
    slate = await markdownToSlate(
      extractDocAsMarkdown(
        chunks
          .reduce((acc, current) => {
            return `${acc}\n\n${current.source}`
          }, '')
          .trim()
      )
    )
  } else if (draft) {
    slate = await markdownToSlate(draftToMarkdown(draft))
  }
  return { slate: makeEmptySlate() }
}

export async function getDocDraft(doc: TDoc): TDraftDoc {
  // Apply migration technics incrementally to make sure that showing document
  // has the format of the latest version.
  if (lodash.isString(doc)) {
    return markdownToDraft(doc)
  }
  doc = doc || {}
  const { chunks } = doc
  if (chunks) {
    const source = chunks.reduce((acc, curr) => {
      if (isTextChunk(curr)) {
        return `${acc}\n${curr.source}`
      }
      return acc
    }, '')
    return markdownToDraft(source)
  }
  const { draft } = doc
  if (draft) {
    return draft
  }
  return await makeDoc({})
}

export async function getDocSlate(doc: TDoc | string): Descendant[] {
  let slate
  if (lodash.isString(doc)) {
    slate = await markdownToSlate(doc)
  } else {
    doc = doc || {}
    slate = doc.slate
    if (!lodash.isArray(slate)) {
      const { chunks, draft } = doc
      if (chunks) {
        const source = chunks.reduce((acc, curr) => {
          if (isTextChunk(curr)) {
            return `${acc}\n\n${curr.source}`
          }
          return acc
        }, '')
        slate = await markdownToSlate(source)
      } else if (draft) {
        // Oh, this is a cheeky approach, but we don't have time
        slate = await markdownToSlate(draftToMarkdown(draft))
      } else {
        slate = []
      }
    }
  }
  return enforceMinimalSlate(slate)
}

export async function exctractDoc(doc: TDoc | string): TDoc {
  const slate = await getDocSlate(doc)
  return await makeDoc({ slate })
}

export function getPlainText(doc: TDoc): string[] {
  if (lodash.isString(doc)) {
    return [doc]
  }
  doc = doc || {}
  const { chunks, draft, slate } = doc
  if (slate) {
    return getSlateAsPlainText(slate)
  } else if (chunks) {
    return chunks
      .map((item) => item.source)
      .filter((source) => lodash.isString(source) && source.length > 0)
  } else if (draft) {
    return getDraftAsTextChunks(draft)
  }
  return ['']
}

export function getSlateAsPlainText(children: Descendant[]): string[] {
  const texts = []
  const entities = []
  children.forEach((item) => {
    const [text, itemEntities] = getSlateDescendantAsPlainText(item, '')
    if (text) {
      texts.push(text)
    }
    entities.push(...itemEntities)
  })
  return lodash.concat(texts, entities)
}

function getSlateDescendantAsPlainText(parent: Descendant): string[] {
  const entities = []
  let { text } = parent
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
    children.forEach((item) => {
      let [itemText, itemEntities] = getSlateDescendantAsPlainText(item, '')
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

export function docAsMarkdown(doc: TDoc): string {
  if (lodash.isString(doc)) {
    return doc
  }
  const { chunks, draft, slate } = doc
  if (chunks) {
    return extractDocAsMarkdown(doc)
  }
  if (draft) {
    return draftToMarkdown(draft)
  }
  if (slate) {
    return slateToMarkdown(slate)
  }
  // TODO(akindyakov): Escalate it
  return ''
}

function makeEmptySlate(): Descendant[] {
  return [
    {
      type: kSlateBlockTypeParagraph,
      children: [
        {
          text: '',
        },
      ],
    },
  ]
}

function makeThematicBreak(): ThematicBreakElement {
  return {
    type: kSlateBlockTypeBreak,
    children: [makeLeaf('')],
  }
}

export function makeParagraph(children: Descendant[]): ParagraphElement {
  if (!children) {
    children = [makeLeaf('')]
  }
  return {
    type: kSlateBlockTypeParagraph,
    children,
  }
}

export function makeLink(text, link): LinkElement {
  return {
    type: kSlateBlockTypeLink,
    children: [makeLeaf(text)],
    link,
  }
}

export function makeLeaf(text): LeafElement {
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

function enforceMinimalSlate(items: Descendant[]): Descendant[] {
  if (items.length) {
    return items
  }
  return makeEmptySlate()
}

export function makeTextDoc(text: string): TDoc {
  return {
    slate: [makeParagraph([makeLeaf(text)])],
  }
}
