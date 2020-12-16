import { extractIndexNGramsFromDoc } from "./ngramsIndex";
import { toBase64, fromBase64 } from "./../util/base64";

const uuid = require("uuid");

/**
 * Node attrs:
 *  - ngrams
 */

function packAttrs(attrs) {
  if (!attrs) {
    return null;
  }
  //*dbg*/ console.log("Doc attrs", attrs);
  return toBase64(JSON.stringify(attrs));
}

export function unpackAttrs(attrsStr) {
  try {
    return JSON.parse(fromBase64(attrsStr));
  } catch (err) {
    console.log("Attribute unpack error: ", err);
  }
  return {};
}

export function packDocAttrs(doc) {
  const ngrams = [...extractIndexNGramsFromDoc(doc)];

  // Just a pinch of salt
  const [value0, key0, key1, key2, value1] = uuid.v4().split("-");

  return packAttrs({
    ngrams: ngrams,
    [key0]: value0.slice(1, 5),
    [key1]: value1.slice(0, 2),
    [key2]: value1.slice(3, 8),
  });
}

export const kAttrsHeaderKey = "x-node-attrs";
