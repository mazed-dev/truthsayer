export const EChunkType = Object.freeze({
  Text: 0,
  Asterisk: 1,
  Empty: 2,
});

export interface TChunk {
  type: EChunkType;
  source: string | null;
}

export interface TContentBlock {
  key: string;
  text: string;
  type: string;
  characterList: null;
  depth: number;
  data: Map<any, any>;
}

export interface TEntity {}

export interface TDraftDoc {
  blocks: TContentBlock[];
  entityMap: TEntity[];
}

export interface TDoc {
  chunks: Chunk[];
  draft: TDraftDoc;
}

export const kBlockTypeH1 = "header-one";
export const kBlockTypeH2 = "header-two";
export const kBlockTypeH3 = "header-three";
export const kBlockTypeH4 = "header-four";
export const kBlockTypeH5 = "header-five";
export const kBlockTypeH6 = "header-six";
export const kBlockTypeQuote = "blockquote";
export const kBlockTypeCode = "code-block";
export const kBlockTypeUnorderedItem = "unordered-list-item";
export const kBlockTypeOrderedItem = "ordered-list-item";
export const kBlockTypeUnstyled = "unstyled";
export const kBlockTypeAtomic = "atomic";

export const kBlockTypeHrule = "hrule";
export const kBlockTypeUnorderedCheckItem = "unordered-check-item";

export const kEntityTypeBold = "BOLD";
export const kEntityTypeItalic = "ITALIC";
export const kEntityTypeLink = "LINK";
export const kEntityTypeMonospace = "CODE";
export const kEntityTypeTime = "DATETIME";
export const kEntityTypeUnderline = "UNDERLINE";
export const kEntityTypeImage = "IMAGE";

export const kEntityMutable = "MUTABLE";
export const kEntityImmutable = "IMMUTABLE";

export function isHeaderBlock(block) {
  const { type } = block;
  switch (type) {
    case kBlockTypeH1:
    case kBlockTypeH2:
    case kBlockTypeH3:
    case kBlockTypeH4:
    case kBlockTypeH5:
    case kBlockTypeH6:
      return true;
  }
  return false;
}

export function makeHRuleBlock() {
  return {
    type: kBlockTypeHrule,
    key: generateRandomKey(),
    text: "",
    data: {},
    depth: 0,
    entityRanges: [],
    inlineStyleRanges: [],
  };
}

function makeEntity({ type, mutability, data }) {
  return { type, mutability, data };
}

export function makeLinkEntity(href) {
  return makeEntity({
    type: kEntityTypeLink,
    mutability: kEntityMutable,
    data: {
      url: href,
      href: href,
    },
  });
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
  type= type || kBlockTypeUnstyled;
  key= key || generateRandomKey();
  text= text || "";
  data= data || {};
  depth= depth || 0;
  entityRanges= entityRanges || [];
  inlineStyleRanges= inlineStyleRanges || [];
  return {
    type,
    key,
    text,
    data,
    depth,
    entityRanges,
    inlineStyleRanges,
  };
}

function makeEntityRange({ offset, length, key }) {
  return { offset, length, key };
}

export function makeUnstyledBlock(text) {
  return makeBlock({
    type: kBlockTypeUnstyled,
    text: text,
  });
}

export function addLinkBlock({
  draft,
  text,
  href,
  blockType,
  depth,
}): TDraftDoc {
  blockType = blockType || kBlockTypeUnstyled;
  const entity = makeLinkEntity(href);
  const eKey = generateRandomKey();
  const block = makeBlock({
    type: blockType,
    text: text,
    depth: depth,
    entityRanges: [
      makeEntityRange({
        offset: 0,
        length: text.length,
        key: eKey,
      }),
    ],
  });
  draft.blocks = draft.blocks.concat(block);
  draft.entityMap[eKey] = entity;
  return draft;
}

export function generateRandomKey(): string {
  return Math.random().toString(32).substring(2);
}
