export interface TChunk {
  type: number;
  source: string;
}

export interface TDoc {
  chunks: Chunk[];
}
