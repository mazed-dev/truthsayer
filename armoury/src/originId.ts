import normalizeUrl from 'normalize-url'

import xxh from 'xxhashjs'

const kOriginSeed = 0x5ecef009

export function _uint32ToInt32(u: number): number {
  return u > 0x7fffffff ? u & (0xffffffff - 0x80000000 - 0x80000000) : u
}

/**
 * 🔓💩 The nature of this hash is suspected to be likely insecure.
 *
 * ⚠ This type is expected to match smuggler-api.OriginHash
 */
type OriginHash = number

/**
 * 🔐 Expected to eventually be ineligible to admins.
 *
 * ⚠ This type is expected to match smuggler-api.OriginId
 * */
type OriginId = {
  id: OriginHash
}

/**
 * Generate @see OriginId for given URL.
 *
 * @param {string} url - URL string to generate OriginId for.
 * @returns {number, string} generated origin OriginId and stabilised URL
 */
export async function genOriginId(url: string): Promise<
  OriginId & {
    stableUrl: string
  }
> {
  const stableUrl = stabiliseUrlForOriginId(url)
  const h = xxh.h32(kOriginSeed)
  h.update(stableUrl)
  const u32Value = h.digest().toNumber()
  const id = _uint32ToInt32(u32Value)
  return { id, stableUrl }
}

export function stabiliseUrlForOriginId(url: string): string {
  return normalizeUrl(url, {
    forceHttps: true,
    normalizeProtocol: true,
    removeTrailingSlash: true,
    // Remove ads campaign data from query of given URLs
    // https://support.google.com/analytics/answer/1033863
    removeQueryParameters: [/^utm_\w+/i, /^itm_\w+/i],
    sortQueryParameters: true,
    stripAuthentication: true,
    stripHash: true,
    stripProtocol: false,
    stripTextFragment: true,
    stripWWW: true,
  })
}
