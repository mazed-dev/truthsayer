import { Descendant } from 'slate'

export const EChunkType = Object.freeze({
  Text: 0,
  Asterisk: 1,
  Empty: 2,
})

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

export interface TDoc {
  chunks: Chunk[]
  draft: TDraftDoc
  slate: Descendant[]
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

export const kEntityTypeBold = 'BOLD'
export const kEntityTypeItalic = 'ITALIC'
export const kEntityTypeLink = 'LINK'
export const kEntityTypeMonospace = 'CODE'
export const kEntityTypeTime = 'DATETIME'
export const kEntityTypeUnderline = 'UNDERLINE'
export const kEntityTypeImage = 'IMAGE'

export const kEntityMutable = 'MUTABLE'
export const kEntityImmutable = 'IMMUTABLE'

/**
 * Slate blocks
 */
export const kSlateDescTypeH1 = 'heading_one'
export const kSlateDescTypeH2 = 'heading_two'
export const kSlateDescTypeH3 = 'heading_three'
export const kSlateDescTypeH4 = 'heading_four'
export const kSlateDescTypeH5 = 'heading_five'
export const kSlateDescTypeH6 = 'heading_six'
export const kSlateDescTypeBreak = 'thematic_break'
export const kSlateDescTypeCode = 'code_block'
export const kSlateDescTypeOrderedList = 'ol_list'
export const kSlateDescTypeParagraph = 'paragraph'
export const kSlateDescTypeQuote = 'block_quote'
export const kSlateDescTypeUnorderedList = 'ul_list'
export const kSlateDescTypeListItem = 'list-item'

export function isHeaderBlock(block) {
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

export function isHeaderSlateBlock(block: Descendant): boolean {
  const { type } = block
  switch (type) {
    case kSlateDescTypeH1:
    case kSlateDescTypeH2:
    case kSlateDescTypeH3:
    case kSlateDescTypeH4:
    case kSlateDescTypeH5:
    case kSlateDescTypeH6:
      return true
  }
  return false
}

export function isTextSlateBlock(block: Descendant): boolean {
  const { type } = block
  switch (type) {
    case kSlateDescTypeParagraph:
      return true
  }
  return false
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

function makeEntity({ type, mutability, data }) {
  return { type, mutability, data }
}

export function makeLinkEntity(href) {
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

function makeEntityRange({ offset, length, key }) {
  return { offset, length, key }
}

export function makeUnstyledBlock(text) {
  return makeBlock({
    type: kBlockTypeUnstyled,
    text,
  })
}

export function addLinkBlock({
  draft,
  text,
  href,
  blockType,
  depth,
}): TDraftDoc {
  blockType = blockType || kBlockTypeUnstyled
  const entity = makeLinkEntity(href)
  const eKey = generateRandomKey()
  const block = makeBlock({
    type: blockType,
    text,
    depth,
    entityRanges: [
      makeEntityRange({
        offset: 0,
        length: text.length,
        key: eKey,
      }),
    ],
  })
  draft.blocks = draft.blocks.concat(block)
  draft.entityMap[eKey] = entity
  return draft
}

export function generateRandomKey(): string {
  return Math.random().toString(32).substring(2)
}
