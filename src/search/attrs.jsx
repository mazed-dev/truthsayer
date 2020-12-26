import { extractIndexNGramsFromDoc } from "./ngramsIndex";
import { base64 } from "./../util/base64.jsx";

import { TNode, TNodeAttrs } from "./../node/node.jsx";

const uuid = require("uuid");

export function extractDocAttrs(doc) {
  const ngrams = [...extractIndexNGramsFromDoc(doc)];

  return {
    ngrams: ngrams,
    // Just a pinch of salt to make sure that every time attributes are different
    salt: uuid.v1(),
  };
}
