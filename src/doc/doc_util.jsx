import { TDoc, TChunk, EChunkType } from "./types.jsx";

import { cloneDeep } from "lodash";

import {
  makeChunk,
  makeHRuleChunk,
  makeAsteriskChunk,
  isHeaderChunk,
  isTextChunk,
  makeBlankCopyOfAChunk,
} from "./chunk_util.jsx";

import { 
  docToMarkdown,
  markdownToDraft,
} from "../markdown/conv.jsx";

import {
  isHeaderBlock,
  kBlockTypeUnorderedCheckItem,
  makeHRuleBlock,
  makeUnstyledBlock,
} from "./../doc/types.jsx";

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
  } else if ("draft" in doc) {
    const { draft } = doc;
    const title = draft.blocks.reduce((acc, item) => {
      if (!acc && isHeaderBlock(item)) {
        const title = _makeTitleFromRaw(item.text);
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
  return "Some page" + "\u2026";
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
    doc = makeDoc({
      draft: markdownToDraft(doc),
    });
  }
  let title = exctractDocTitle(doc);
  let clonedBadge: string = "_Copy of [" + title + "](" + nid + ")_";
  if ("chunks" in doc) {
    let chunks = doc.chunks.concat(makeHRuleChunk(), makeChunk(clonedBadge));
    return makeDoc({
      chunks: chunks,
    });
  } else if ("draft" in doc) {
    doc.draft.blocks = doc.draft.blocks.concat(
      makeHRuleBlock(),
      makeUnstyledBlock(clonedBadge),
    );
    return doc;
  }
  return makeDoc();
}

// Deprecated
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

// Deprecated
export function enforceTopHeader(doc: TDoc): TDoc {
  if (typeof doc === "string") {
    doc = makeDoc({
      draft: markdownToDraft(doc),
    });
  }
  let chunks = doc.chunks || new Array();
  if (chunks.length === 0 || !isHeaderChunk(doc.chunks[0])) {
    chunks.unshift(makeAsteriskChunk());
  }
  doc.chunks = chunks;
  return doc;
}

export function makeDoc({ chunks, draft }): TDoc {
  if (draft) {
    return { draft };
  }
  if (chunks) {
    return {
      draft: markdownToDraft(
        extractDocAsMarkdown(chunks.reduce((acc, current) => {
            return acc + "\n\n" + current.source;
          }, "").trim()
        )
      )
    };
  }
  return {
    draft: markdownToDraft(""),
  };
}

function makeBlankCopyOfABlock(block) {
  if (block.type === kBlockTypeUnorderedCheckItem) {
    let b = cloneDeep(block);
    b.data.checked = false;
    return b;
  }
  return block;
}

export function makeBlankCopy(doc: TDoc | string, nid: string): TDoc {
  if (typeof doc === "string") {
    doc = makeDoc({
      draft: markdownToDraft(doc),
    });
  } else if ("chunks" in doc) {
    doc = makeDoc({
      chunks: doc.chunks,
    });
  }
  let { draft } = doc;
  if (draft == null) {
    return makeDoc();
  }
  const title = exctractDocTitle(doc);
  const clonedBadge: string = "_Blank copy of [" + title + "](" + nid + ")_";

  draft.blocks = draft.blocks.map((block) => {
    return makeBlankCopyOfABlock(block);
  }).push(makeHRuleBlock(), makeUnstyledBlock(clonedBadge));
  return makeDoc({ draft });
}

export function getDocDraft(doc: TDoc): TDraftDoc {
  if (typeof doc === "string") {
    return markdownToDraft(doc);
  }
  if (doc.chunks) {
    const source = doc.chunks.reduce((acc, curr) => {
      if (isTextChunk(curr)) {
        return acc + "\n" + curr.source;
      }
      return acc;
    }, "");
    return markdownToDraft(source);
  }
  return (
    doc.draft || {
      blocks: [],
      entityMap: [],
    }
  );
}

export function docAsMarkdown(doc: TDoc): string {
  if (typeof doc === "string") {
    return doc;
  }
  const { chunks, draft } = doc;
  if (chunks) {
    return extractDocAsMarkdown(doc);
  }
  if (draft) {
    return docToMarkdown(draft);
  }
  // TODO(akindyakov): Escalate it
  return "";
}
