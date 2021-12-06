import normalizeUrl from 'normalize-url'

import xxhash from 'xxhash-wasm'

const kOriginSeed = 0x5ecef009

function str2ArrayBuffer(str: string): Uint8Array {
  const encoder = new window.TextEncoder()
  return encoder.encode(str)
}

export async function genOriginId(url: string): Promise<number> {
  const { h32Raw } = await xxhash()
  return h32Raw(str2ArrayBuffer(stabiliseUrl(url)), kOriginSeed).valueOf()
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
