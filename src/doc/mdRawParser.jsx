
import { TChunk, TDoc } from "./types";

export function parseRawSource(source: string): TDoc {
  return {
    chunks: source
      .split("\n\n")
      .filter((src) => {
        return src != null && src.length > 0;
      })
      .map((src, index) => {
        return {
          type: 0,
          source: src,
        };
      }),
  };
}

export function mergeChunks(left: TChunk, right: TChunk): TChunk {
  return {
    type: 0,
    source: left.source + right.source,
  };
}
