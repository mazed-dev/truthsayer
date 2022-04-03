import normalizeUrl from 'normalize-url'

import xxh from 'xxhashjs'

const kOriginSeed = 0x5ecef009

export function _uint32ToInt32(u: number): number {
  return u > 0x7fffffff ? u & (0xffffffff - 0x80000000 - 0x80000000) : u
}

export async function genOriginId(
  url: string
): Promise<{ id: number; url: string }> {
  url = stabiliseOriginUrl(url)
  const h = xxh.h32(kOriginSeed)
  h.update(url)
  const u32Value = h.digest().toNumber()
  const id = _uint32ToInt32(u32Value)
  return { id, url }
}

export function stabiliseOriginUrl(url: string): string {
  return normalizeUrl(url.toLowerCase(), {
    forceHttps: true,
    normalizeProtocol: true,
    removeTrailingSlash: true,
    removeQueryParameters: false, // Do not turn it on, it's broken for firefox
    sortQueryParameters: true,
    stripAuthentication: true,
    stripHash: true,
    stripProtocol: false,
    stripTextFragment: true,
    stripWWW: true,
  })
}
