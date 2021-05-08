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
