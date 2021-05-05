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
