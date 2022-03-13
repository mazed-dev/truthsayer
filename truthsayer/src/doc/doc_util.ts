import { TNode, NodeTextData, makeNodeTextData } from 'smuggler-api'

import moment from 'moment'

import { slateToMarkdown, markdownToSlate } from '../markdown/slate'

import {
  DateTimeElement,
  LeafElement,
  LinkElement,
  ParagraphElement,
  ThematicBreakElement,
  kSlateBlockTypeBreak,
  kSlateBlockTypeDateTime,
  kSlateBlockTypeLink,
  kSlateBlockTypeParagraph,
} from 'elementary'
import { Optional } from 'armoury'

import lodash from 'lodash'

export function unixToString(
  timestamp: number,
  format: Optional<string>
): string {
  const timeMoment = moment.unix(timestamp)
  return momentToString(timeMoment, format)
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

export async function makeDoc({
  slate,
  chunks,
  plain,
}: {
  slate?: SlateText
  chunks?: TChunk[]
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
  if (plain) {
    const slate = await markdownToSlate(plain)
    return new TDoc(slate)
  }
  return new TDoc(makeNodeTextData().slate as SlateText)
}
