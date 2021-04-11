export const EChunkType = Object.freeze({
  Text: 0,
  Asterisk: 1,
  Empty: 2,
});

export interface TChunk {
  type: EChunkType;
  source: string | null;
}

export interface TDoc {
  chunks: Chunk[];
}
