const base64js = require("base64-js");

/**
 * Node attrs:
 *  - ngrams
 */

export function packAttrs(attrs) {
  if (!attrs) {
    return null;
  }
  return base64js.toByteArray(attrs);
}

export function unpackAttrs(attrsStr) {
  try {
    return base64js.fromByteArray(attrsStr);
  } catch(err) {
    console.error("Attribute unpack error: ", err);
  }
  return {};
}
