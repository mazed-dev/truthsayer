import { TDoc, TChunk, EChunkType } from "./types";

import {
  makeChunk,
  makeHRuleChunk,
  makeAsteriskChunk,
  isHeaderChunk,
  isTextChunk,
  makeBlankCopyOfAChunk,
} from "./chunk_util.jsx";
import { parseRawSource } from "./mdRawParser.jsx";

export function exctractDocTitle(doc: TDoc | string): string {
  if (typeof doc === "string") {
    return _makeTitleFromRaw(doc);
  } else if ("chunks" in doc) {
    const chunks = doc.chunks;
    const title = chunks.reduce((acc, item) => {
      if (!acc && isTextChunk(item)) {
        const title = _makeTitleFromRaw(item.source);
        if (title) {
          return title;
        }
      }
      return acc;
    }, null);
    if (title) {
      return title;
    }
  }
  // For an empty doc
  return "Some no name page" + "\u2026";
}

function _makeTitleFromRaw(source: string): string {
  const title = source
    .slice(0, 128)
    .replace(/\s+/g, " ")
    // Replace markdown links with title of the link
    .replace(/\[([^\]]+)\][^\)]+\)/g, "$1")
    .replace(/^[# ]+/, "")
    .replace(/[\[\]]+/, "");
  if (title.length > 36) {
    return title.slice(0, 36) + "\u2026";
  } else {
    return title;
  }
}

export function makeACopy(doc: TDoc | string, nid: string): TDoc {
  if (typeof doc === "string") {
    doc = parseRawSource(doc);
  }
  let title = exctractDocTitle(doc);
  let clonedBadge: string = "_Copy of [" + title + "](" + nid + ")_";
  let chunks = doc.chunks.concat(makeHRuleChunk(), makeChunk(clonedBadge));
  return makeDoc({
    chunks: chunks,
  });
}

export function extractDocAsMarkdown(doc: TDoc): string {
  if (typeof doc === "string") {
    return doc;
  }
  return doc.chunks
    .reduce((acc, current) => {
      return acc + "\n\n" + current.source;
    }, "")
    .trim();
}

export function enforceTopHeader(doc: TDoc): TDoc {
  if (typeof doc === "string") {
    doc = parseRawSource(doc);
  }
  let chunks = doc.chunks || new Array();
  if (chunks.length === 0 || !isHeaderChunk(doc.chunks[0])) {
    chunks.unshift(makeAsteriskChunk());
  }
  doc.chunks = chunks;
  return doc;
}

export function makeDoc({ chunks }): TDoc {
  if (chunks) {
    return {
      chunks: chunks,
    };
  }
}

export function makeBlankCopy(doc: TDoc | string, nid: string): TDoc {
  if (typeof doc === "string") {
    doc = parseRawSource(doc);
  }
  if (!("chunks" in doc)) {
    return makeDoc({
      chunks: [],
    });
  }
  let chunks = doc.chunks.map((chunk) => {
    return makeBlankCopyOfAChunk(chunk);
  });
  const title = exctractDocTitle(doc);
  const clonedBadge: string = "_Blank copy of [" + title + "](" + nid + ")_";
  chunks.push(makeHRuleChunk(), makeChunk(clonedBadge));
  return makeDoc({
    chunks: chunks,
  });
}
