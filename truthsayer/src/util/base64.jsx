import { Base64 } from 'js-base64'

export function toBase64(s: string): string {
  return Base64.btoa(s)
}

export function fromBase64(a: string): string {
  return Base64.atob(a)
}

function _toByteArray(b64: string): Uint8Array {
  return Base64.toUint8Array(b64)
}

function _fromByteArray(a: Uint8Array): string {
  return Base64.fromUint8Array(a)
}

function _toObject(a: string): Any {
  return JSON.parse(_decode(a))
}

function _fromObject(o: Any): string {
  return _encode(JSON.stringify(o))
}

function _encode(utf8: string): string {
  return Base64.encode(utf8)
}

function _decode(b64: string): string {
  return Base64.decode(b64)
}

export const base64 = {
  fromStr: toBase64,
  toStr: fromBase64,
  toByteArray: _toByteArray,
  fromByteArray: _fromByteArray,
  toObject: _toObject,
  fromObject: _fromObject,
  encode: _encode,
  decode: _decode,
}
