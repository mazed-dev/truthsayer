import { TChunk, TDoc } from "./types";

export function exctractDocTitle(doc: TDoc | string) {
  // if (typeof source === "string") {
  if ("chunks" in doc) {
    return _makeTitleFromRaw(doc.chunks.source);
  } else {
    return _makeTitleFromRaw(doc);
  }
}

function _makeTitleFromRaw(source: string) {
  const title = source
    .slice(0, 128)
    .replace("\n", " ")
    .replace(/^[# ]+/, "");
  return title;
}
