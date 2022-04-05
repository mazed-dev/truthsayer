import normalizeUrl from 'normalize-url'

import xxh from 'xxhashjs'

const kOriginSeed = 0x5ecef009

export function _uint32ToInt32(u: number): number {
  return u > 0x7fffffff ? u & (0xffffffff - 0x80000000 - 0x80000000) : u
}

export type OriginId = {
  id: number
  stableUrl: string
}

/**
 * Generate origin OriginId for given URL.
 *
 * @param {string} url - URL string to generate OriginId for.
 * @returns {number, string} generated origin OriginId and stabilised URL
 */
export async function genOriginId(url: string): Promise<OriginId> {
  const stableUrl = stabiliseUrlForOriginId(url)
  const h = xxh.h32(kOriginSeed)
  h.update(stableUrl)
  const u32Value = h.digest().toNumber()
  const id = _uint32ToInt32(u32Value)
  return { id, stableUrl }
}

export function stabiliseUrlForOriginId(url: string): string {
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
