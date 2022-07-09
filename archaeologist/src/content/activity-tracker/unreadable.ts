import { isMemorable } from '../extractor/unmemorable'
import { log } from 'armoury'

import { isProbablyReaderable } from '@mozilla/readability'

const kHomepage: RegExp[] = [
  /^\/?$/, // empty path
  /index.html$/,
  /index.php$/,
]
export function _isArticleUrl(url: URL): boolean {
  if (
    kHomepage.find((r: RegExp) => {
      return url.pathname.match(r)
    })
  ) {
    log.debug(`The pathname ${url.pathname} is a homepage path - unreadable`)
    return false
  }
  return true
}

const kBlocklist: RegExp[] = [
  // Because google.keep uses URL hash based routing, so individual notes are
  // not distinguishable for archaeologist - they all have the same origin ID.
  /keep\.google\.com\//,
  // Because archaeologist can't yet extract text && description from GDocs
  /docs\.google\.com\//,
]
const kAllowlist: RegExp[] = []
/**
 * Urls blocked by Mazed dev team, this is a hack to hardcode usage of activity
 * tracker on certain pages. Later one we can replace it with better auto
 * detectors of readability, by improving of `isProbablyReaderable` or
 * developing some ML powered classifiers.
 */
export function _isManuallyAllowed(url: string): boolean {
  // Allowlist overrides blocklist
  // For instance, to be able to block some hostname entirely with some
  // exceptions for website blog and newspage.
  if (kAllowlist.find((r: RegExp) => url.match(r))) {
    log.debug(`The URL ${url} is a is allowed for autosaving`)
    return true
  }
  if (kBlocklist.find((r: RegExp) => url.match(r))) {
    log.debug(`The URL ${url} is a is not allowed for autosaving`)
    return false
  }
  return true
}

/**
 * Hacky lightweight function with a pile of heuristics to determine if given
 * URL refers a readable page.
 */
export function isUrlReadable(url: string): boolean {
  return (
    isMemorable(url) && _isArticleUrl(new URL(url)) && _isManuallyAllowed(url)
  )
}

export function isPageReadable(url: string, document_: Document): boolean {
  return isUrlReadable(url) && isProbablyReaderable(document_)
}
