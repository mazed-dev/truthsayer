const _base64js = require("base64-js");

export function toBase64(s: string): string {
  return btoa(s);
}

export function fromBase64(a: string): string {
  return atob(a);
}

function _toByteArray(a: string): Uint8Array {
  return _base64js.toByteArray(a);
}

function _fromByteArray(a: Uint8Array): string {
  return _base64js.fromByteArray(a);
}

function _toObject(a: string): Any {
  return toBase64(JSON.stringify(o));
}

function _fromObject(o: Any): string {
  return toBase64(JSON.stringify(o));
}

export const base64: Object = {
  fromStr: toBase64,
  toStr: fromBase64,
  toByteArray: _toByteArray,
  fromByteArray: _fromByteArray,
  toObject: _toObject,
  fromObject: _fromObject,
};
