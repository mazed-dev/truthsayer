import crc from "crc";

import { isHeaderChunk, extractChunkIndexText } from "../doc/chunk_util.jsx";

const kMdHeaderRegex = /^#+ /;
const kMdSyntaxPunctuation = /[.,`‘’"/#^&*?!;:{}=\-_~()[\]]/g;
const kMdSyntaxLink = /\[([^)]*)\]\(.*\)/g;
const kLongSpace = / +/g;
const kFOL = /^/;
const kEOL = /$/;
const kWindowSize = 3;

const kParagraphLengthLimit = 600;
const kNgramsNumberLimit = 500;

export function makeNGrams(text) {
  text = text
    .slice(0, kParagraphLengthLimit)
    .replace("\n", " ")
    .replace(kMdSyntaxLink, " $1 ")
    .replace(kMdSyntaxPunctuation, " ")
    .replace(kFOL, " ")
    .replace(kEOL, " ")
    .replace(kLongSpace, " ")
    .toLowerCase();
  //*dbg*/ console.log("makeNGrams", text.length, text);
  let ngrams = [];
  for (let i = kWindowSize; i < text.length; i++) {
    ngrams.push(text.slice(i - kWindowSize, i));
  }
  return ngrams;
}

export function extractIndexNGramsFromText(mdText) {
  return makeNGrams(mdText).map((gram) => crc.crc32(gram));
}

export function extractIndexNGramsFromDoc(doc) {
  let headParagraphsCounter = 0;
  let ngrams = new Set();
  doc.chunks.forEach((chunk) => {
    if (ngrams.size >= kNgramsNumberLimit) {
      return;
    }
    // if (!isHeaderChunk(chunk)) {
    //   //*dbg*/ console.log("Is not a header");
    //   if (headParagraphsCounter > 1) {
    //     //*dbg*/ console.log("Skip paragraph");
    //     return;
    //   }
    //   headParagraphsCounter += 1;
    // }
    const text = extractChunkIndexText(chunk);
    if (text != null) {
      extractIndexNGramsFromText(text).forEach((ngr) => {
        if (ngrams.size < kNgramsNumberLimit) {
          ngrams.add(ngr);
        }
      });
    }
  });
  return ngrams;
}
