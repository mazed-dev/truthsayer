import { TChunk } from './types.ts'
import { TDoc } from './doc_util'

export function parseRawSource(source: string): TDoc {
  return {
    chunks: source
      .split('\n\n\n')
      .filter((src) => {
        return src != null && src.length > 0
      })
      .map((src, index) => {
        return {
          type: 0,
          source: src,
        }
      }),
  }
}

export function mergeChunks(left: TChunk, right: TChunk): TChunk {
  return {
    type: 0,
    source: left.source + right.source,
  }
}
