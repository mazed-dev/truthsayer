import normalizeUrl from 'normalize-url'

import xxhash from 'xxhash-wasm'

const kOriginSeed = 0x5ecef009

function str2ArrayBuffer(str: string): Uint8Array {
  const encoder = new window.TextEncoder()
  return encoder.encode(str)
}

export function _uint32ToInt32(u: number): number {
  return u > 0x7fffffff ? u - 0x80000000 - 0x80000000 : u
}

export async function genOriginId(url: string): Promise<number> {
  const { h32Raw } = await xxhash()
  const u32Value = h32Raw(
    str2ArrayBuffer(stabiliseUrl(url)),
    kOriginSeed
  ).valueOf()
  return _uint32ToInt32(u32Value)
}

export function stabiliseUrl(url: string): string {
  return normalizeUrl(url.toLowerCase(), {
    forceHttps: true,
    normalizeProtocol: true,
    removeTrailingSlash: true,
    sortQueryParameters: true,
    stripAuthentication: true,
    stripHash: true,
    stripProtocol: false,
    stripTextFragment: true,
    stripWWW: true,
  })
}
