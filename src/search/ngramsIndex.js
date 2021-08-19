import { crc32 } from 'crc'

import { isHeaderChunk } from '../doc/chunk_util.jsx'

const kMdHeaderRegex = /^#+ /
const kMdSyntaxPunctuation = /[.,`‘’"/#^&*?!;:{}=\-_~()[\]]/g
const kMdSyntaxLink = /\[([^)]*)\]\(.*\)/g
const kLongSpace = / +/g
const kFOL = /^/
const kEOL = /$/
const kWindowSize = 3

const kParagraphLengthLimit = 600
const kNgramsNumberLimit = 500

export function makeNGrams(text) {
  text = text
    .slice(0, kParagraphLengthLimit)
    .replace('\n', ' ')
    .replace(kMdSyntaxLink, ' $1 ')
    .replace(kMdSyntaxPunctuation, ' ')
    .replace(kFOL, ' ')
    .replace(kEOL, ' ')
    .replace(kLongSpace, ' ')
    .toLowerCase()
  //* dbg*/ console.log("makeNGrams", text.length, text);
  const ngrams = []
  for (let i = kWindowSize; i < text.length; i++) {
    ngrams.push(text.slice(i - kWindowSize, i))
  }
  return ngrams
}

export function extractIndexNGramsFromText(mdText) {
  return makeNGrams(mdText).map((gram) => crc32(gram))
}

export function extractIndexNGramsFromDoc(doc) {
  const headParagraphsCounter = 0
  const ngrams = new Set()
  doc.chunks.forEach((chunk) => {
    if (ngrams.size >= kNgramsNumberLimit) {
      return
    }
    // if (!isHeaderChunk(chunk)) {
    //   //*dbg*/ console.log("Is not a header");
    //   if (headParagraphsCounter > 1) {
    //     //*dbg*/ console.log("Skip paragraph");
    //     return;
    //   }
    //   headParagraphsCounter += 1;
    // }
    const { source } = chunk
    if (source != null) {
      extractIndexNGramsFromText(source).forEach((ngr) => {
        if (ngrams.size < kNgramsNumberLimit) {
          ngrams.add(ngr)
        }
      })
    }
  })
  return ngrams
}
