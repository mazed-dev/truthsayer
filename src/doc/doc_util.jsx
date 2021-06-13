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

import { draftToMarkdown, markdownToDraft } from '../markdown/conv.jsx'
import { slateToMarkdown, markdownToSlate } from '../markdown/slate.ts'

import {
  isHeaderBlock,
  kBlockTypeUnorderedCheckItem,
  makeHRuleBlock,
  makeUnstyledBlock,
  addLinkBlock,
  isHeaderSlateBlock,
  isTextSlateBlock,
} from './types.ts'

const lodash = require('lodash')

export function exctractDocTitle(doc: TDoc | string): string {
  if (lodash.isString(doc)) {
    return _makeTitleFromRaw(doc)
  } else if ('chunks' in doc) {
    const chunks = doc.chunks
    const title = chunks.reduce((acc, item) => {
      if (!acc && isTextChunk(item)) {
        const title = _makeTitleFromRaw(item.source)
        if (title) {
          return title
        }
      }
      return acc
    }, null)
    if (title) {
      return title
    }
  } else if ('draft' in doc) {
    const { draft } = doc
    const title = draft.blocks.reduce((acc, item) => {
      if (!acc && isHeaderBlock(item)) {
        const title = _makeTitleFromRaw(item.text)
        if (title) {
          return title
        }
      }
      return acc
    }, null)
    if (title) {
      return title
    }
  } else if ('slate' in doc) {
    const { slate } = doc
    const title = slate.reduce((acc, item) => {
      if (!acc && (isHeaderSlateBlock(item) || isTextSlateBlock(item))) {
        const title = _makeTitleFromRaw(item.text)
        if (title) {
          return title
        }
      }
      return acc
    }, null)
    if (title) {
      return title
    }
  }
  // For an empty doc
  return 'Some page' + '\u2026'
}

function _makeTitleFromRaw(source: string): string {
  const title = source
    .slice(0, 128)
    .replace(/\s+/g, ' ')
    // Replace markdown links with title of the link
    .replace(/\[([^\]]+)\][^\)]+\)/g, '$1')
    .replace(/^[# ]+/, '')
    .replace(/[\[\]]+/, '')
  if (title.length > 36) {
    return `${title.slice(0, 36)}\u2026`
  } else {
    return title
  }
}

export async function makeACopy(doc: TDoc | string, nid: string): TDoc {
  if (lodash.isString(doc)) {
    const slate = await markdownToSlate(doc)
    doc = await makeDoc({ slate })
  }
  let draft
  if ('chunks' in doc) {
    doc = await makeDoc({
      chunks: doc.chunks,
    })
    draft = { doc }
  } else {
    draft = lodash.cloneDeep(doc.draft)
  }
  draft = draft || {}
  const title = exctractDocTitle(doc)
  draft.blocks = draft.blocks.concat(makeHRuleBlock())
  const text = `Copy of "${title}"`
  draft = addLinkBlock({
    draft,
    text,
    href: nid,
  })
  return await makeDoc({ draft })
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

export async function makeDoc({ chunks, draft, slate }): TDoc {
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
  } else {
    slate = await markdownToSlate('')
  }
  return { slate }
}

function makeBlankCopyOfABlock(block) {
  if (block.type === kBlockTypeUnorderedCheckItem) {
    const b = cloneDeep(block)
    b.data.checked = false
    return b
  }
  return block
}

export async function makeBlankCopy(doc: TDoc | string, nid: string): TDoc {
  if (lodash.isString(doc)) {
    const slate = await markdownToSlate(doc)
    doc = await makeDoc({ slate })
  } else if ('chunks' in doc) {
    doc = await makeDoc({
      chunks: doc.chunks,
    })
  }
  let { draft } = doc
  draft = draft || {}
  const title = exctractDocTitle(doc)
  draft.blocks = draft.blocks.map((block) => {
    return makeBlankCopyOfABlock(block)
  })
  draft.blocks.push(makeHRuleBlock())
  const text = `Blank copy of "${title}"`
  draft = addLinkBlock({
    draft,
    text,
    href: nid,
  })
  return await makeDoc({ draft })
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
  return await makeDoc()
}

export async function getDocSlate(doc: TDoc): Descendant[] {
  if (lodash.isString(doc)) {
    return await markdownToSlate(doc)
  }
  doc = doc || {}
  let { chunks, draft, slate } = doc
  if (slate) {
    return slate
  }
  if (chunks) {
    const source = chunks.reduce((acc, curr) => {
      if (isTextChunk(curr)) {
        return `${acc}\n${curr.source}`
      }
      return acc
    }, '')
    slate = await markdownToSlate(source)
  } else if (draft) {
    slate = await markdownToSlate(draftToMarkdown(draft))
  } else {
    slate = await makeDoc().slate
  }
  return slate
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
