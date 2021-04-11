import { TChunk, EChunkType } from "./types.jsx";

export function mergeChunks(left: TChunk, right: TChunk): TChunk {
  return {
    type: EChunkType.Text,
    source: left.source + "\n" + right.source,
  };
}

export function makeChunk(source: string, type?: number): TChunk {
  //*dbg*/ console.log("makeChunk", source);
  return {
    type: type ?? EChunkType.Text,
    source: source,
  };
}

export function makeAsteriskChunk(): TChunk {
  return {
    type: EChunkType.Asterisk,
    source: null,
  };
}

export function trimChunk(chunk: TChunk, size: number): TChunk {
  const hellip = size < chunk.source.length ? "&hellip;" : "";
  return {
    type: chunk.type,
    source: chunk.source.slice(0, size) + hellip,
  };
}

export function getChunkSize(chunk: TChunk): number {
  if (chunk.source) {
    return chunk.source.length;
  }
  return 0;
}

function getChunkHeaderLevel(source: string): number {
  const matched = source.match(/^(#+) /);
  if (matched && matched.length > 1) {
    return matched[1].length;
  }
  return -1;
}

export function isAsteriskChunk(chunk: TChunk): boolean {
  return chunk.type === EChunkType.Asterisk;
}

export function isTextChunk(chunk: TChunk): boolean {
  return chunk.type === EChunkType.Text && chunk.source;
}

export function isHeaderChunk(chunk: TChunk): boolean {
  if (chunk.type != null) {
    if (chunk.type === EChunkType.Text) {
      return getChunkHeaderLevel(chunk.source) > 0;
    } else if (chunk.type === EChunkType.Asterisk) {
      return true;
    }
  }
  return false;
}
