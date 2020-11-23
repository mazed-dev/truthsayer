import crc from "crc";

const kMdHeaderRegex = /^#+ /;
const kMdSyntaxPunctuation = /[.,`‘’"/#^&*?!;:{}=\-_~()[\]]/g;
const kMdSyntaxLink = /\[([^)]*)\]\(.*\)/g;
const kLongSpace = / +/g;
const kFOL = /^/;
const kEOL = /$/;
const kWindowSize = 3;

export function makeNGrams(text) {
  text = text
    .replace("\n", " ")
    .replace(kMdSyntaxLink, " $1 ")
    .replace(kMdSyntaxPunctuation, " ")
    .replace(kFOL, " ")
    .replace(kEOL, " ")
    .replace(kLongSpace, " ")
    .toLowerCase();
  var ngrams = [];
  for (var i = kWindowSize; i < text.length; i++) {
    ngrams.push(text.slice(i - kWindowSize, i));
  }
  return ngrams;
}

export function extractIndexNGramsFromText(mdText) {
  return makeNGrams(mdText).map((gram) => crc.crc32(gram));
}

export function extractIndexNGramsFromDoc(doc) {
  var headParagraphsCounter = 0;
  var ngrams = new Set();
  for (var i in doc.chunks) {
    const chunk = doc.chunks[i];
    const isHeader = chunk.source.match(kMdHeaderRegex);
    if (!isHeader) {
      //*dbg*/ console.log("Is not a header");
      if (headParagraphsCounter > 1) {
        //*dbg*/ console.log("Skip paragraph");
        continue;
      }
      headParagraphsCounter += 1;
    }
    extractIndexNGramsFromText(chunk.source).forEach((ngr) => ngrams.add(ngr));
  }
  return ngrams;
}
