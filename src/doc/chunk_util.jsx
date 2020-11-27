import { TChunk, TDoc } from "./types";

export function mergeChunks(left: TChunk, right: TChunk): TChunk {
  return {
    type: 0,
    source: left.source + "\n" + right.source,
  };
}

export function makeChunk(source: string, type?: number): TChunk {
  return {
    type: (type ?? 0),
    source: source,
  };
}
