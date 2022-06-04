import { toByteArray, fromByteArray } from 'base64-js'

function _toByteArray(b64: string): Uint8Array {
  return toByteArray(b64)
}

function _fromByteArray(a: Uint8Array): string {
  return fromByteArray(a)
}

function _fromObject(o: any): string {
  const json = JSON.stringify(o)
  const uint8array = new TextEncoder().encode(json)
  return fromByteArray(uint8array)
}

function _toObject(a: string): any {
  const uint8array = toByteArray(a)
  const json = new TextDecoder().decode(uint8array)
  return JSON.parse(json)
}

export const base64 = {
  toByteArray: _toByteArray,
  fromByteArray: _fromByteArray,
  string: {
    toObject: _toObject,
    fromObject: _fromObject,
  },
}
