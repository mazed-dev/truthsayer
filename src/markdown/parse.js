import React from "react";

const kMdHeaderRegex = /^#+ /;
const kMdSyntaxPunctuation = /[.,\"\'\/#\^&\*;:{}=\-_`~()\[\]\(\)]/g;
const kMdSyntaxLink = /\[([^)]*)\]\(.*\)/g;
const kLongSpace = / +/g;
const kFOL = /^/;
const kEOL = /$/;

function makeNGrams(text) {
  text = text
    .replace(kMdSyntaxLink, " $1 ")
    .replace(kMdSyntaxPunctuation, " ")
    .replace(kFOL, " ")
    .replace(kEOL, " ")
    .replace(kLongSpace, " ").toLowerCase();
  const winSize = 3;
  var ngrams = [];
  for (var i = winSize; i < text.length; i++) {
    ngrams.push(text.slice(i - winSize, i));
  }
  return ngrams;
}

export function extractIndexNGrams(mdText) {
  var firstParagraphChunk = 0;
  return mdText
    .split("\n")
    .map((line) => makeNGrams(line)).flat();
}

export function extractIndexNGramsFromDoc(doc) {
  var headParagraphsCounter = 0;
  for (var i in doc.chunks) {
    const chunk = doc.chunks[i];

    const isHeader = chunk.source.match(kMdHeaderRegex);
    if (!isHeader) {
      console.log("Is not a header");
      if (headParagraphsCounter > 1) {
        console.log("Skip paragraph");
        continue;
      }
      headParagraphsCounter += 1;
    }

    const ngrams = extractIndexNGrams(chunk.source);
    console.log(ngrams.length, ngrams);
  }
}
