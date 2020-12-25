import { TChunk } from "./types";

export function mergeChunks(left: TChunk, right: TChunk): TChunk {
  return {
    type: 0,
    source: left.source + "\n" + right.source,
  };
}

export function makeChunk(source: string, type?: number): TChunk {
  //*dbg*/ console.log("makeChunk", source);
  return {
    type: type ?? 0,
    source: source,
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
  return chunk.source.length;
}
