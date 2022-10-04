import { normalizeUrl } from './normalize-url'

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
export type OriginId = {
  id: OriginHash
}

export type OriginIdentity = OriginId & {
  stableUrl: string
}

/**
 * Generate @see OriginId for given URL.
 *
 * @param {string} url - URL string to generate OriginId for.
 * @returns {number, string} generated origin OriginId and stabilised URL
 */
export function genOriginId(url: string): OriginIdentity {
  const stableUrl = stabiliseUrlForOriginId(url)
  const h = xxh.h32(kOriginSeed)
  h.update(stableUrl)
  const u32Value = h.digest().toNumber()
  const id = _uint32ToInt32(u32Value)
  return { id, stableUrl }
}

export function stabiliseUrlForOriginId(url: string): string {
  const urlWithProtocol = normalizeUrl(url, {
    forceHttps: true,
    normalizeProtocol: true,
    stripProtocol: false,
  })

  const parsedUrl = new URL(urlWithProtocol)

  return normalizeUrl(urlWithProtocol, {
    removeTrailingSlash: true,
    // Remove ads campaign data from query of given URLs
    // https://support.google.com/analytics/answer/1033863
    removeQueryParameters: [/^utm_\w+/i, /^itm_\w+/i],
    sortQueryParameters: true,
    stripAuthentication: true,
    stripHash: usesHashFragmentAsAnchor(parsedUrl),
    stripTextFragment: true,
    stripWWW: true,
  })
}

/**
 * Return true if this URL uses hash fragments as anchors. false otherwise.
 *
 * The basic use of # fragments in URLs is to identify a portion of a web page,
 * e.g. https://en.wikipedia.org/wiki/URI_fragment#Basics where the underlying
 * web page is exactly the same with and without '#Basics', only the position
 * on it differs. In these cases when URL is converted to an OriginId it is
 * desirable to remove them.
 *
 * For some websites URLs with different # fragments will load completely
 * different content. In this case when URL is converted to an OriginId it is
 * important to keep the fragments intact.
 */
function usesHashFragmentAsAnchor(url: URL): boolean {
  switch (url.host) {
    case 'mail.google.com':
      return false
    default:
      // By default it's assumed that the overwhelming number web pages uses
      // hash fragments as regular anchors
      return true
  }
}
