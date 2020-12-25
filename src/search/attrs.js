import { extractIndexNGramsFromDoc } from "./ngramsIndex";
import { base64 } from "./../util/base64.jsx";

const uuid = require("uuid");

export function unpackAttrs(attrsStr) {
  try {
    return base64.toObject(attrsStr);
  } catch (err) {
    console.log("Attribute unpack error: ", err);
  }
  return {};
}

export function packDocAttrs(doc) {
  const ngrams = [...extractIndexNGramsFromDoc(doc)];

  // Just a pinch of salt
  const [value0, key0, key1, key2, value1] = uuid.v4().split("-");

  return base64.fromObject({
    ngrams: ngrams,
    [key0]: value0.slice(1, 5),
    [key1]: value1.slice(0, 2),
    [key2]: value1.slice(3, 8),
  });
}

export const kAttrsHeaderKey = "x-node-attrs";
