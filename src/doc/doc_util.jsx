import { TChunk, TDoc } from "./types";

export function exctractDocTitle(doc: TDoc | string): string {
  if ("chunks" in doc) {
    if (doc.chunks.length > 0) {
      return _makeTitleFromRaw(doc.chunks[0].source);
    }
    // For an empty doc
    return "next";
  } else {
    return _makeTitleFromRaw(doc);
  }
}

function _makeTitleFromRaw(source: string): string {
  const title = source
    .slice(0, 48)
    .replace("\n", " ")
    .replace(/^[# ]+/, "");
  return title + "&#x2026;";
}
