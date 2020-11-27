
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
