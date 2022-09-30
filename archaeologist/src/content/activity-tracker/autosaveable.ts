import { isMemorable } from '../extractor/unmemorable'
import { isSearchEngineQueryUrl } from '../extractor/searchEngineQuery'
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
  // Block autosaving on google documents, because archaeologist can't yet
  // extract text && description from them.
  /docs\.google\.com\//,
  // Block subpages of PRs on github, only PR comments page (main)
  /github\.com\/[\w-]+\/[\w-]+\/pull\/\d+\/(checks|files|commits)/,
  /\/(login|signin|signup)\/?/i,
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
  return false
}

export function _isManuallyBlocked(url: string): boolean {
  if (kBlocklist.find((r: RegExp) => url.match(r))) {
    log.debug(`The URL ${url} is a is not allowed for autosaving`)
    return true
  }
  return false
}

export function isPageAutosaveable(url: string, document_: Document): boolean {
  if (_isManuallyAllowed(url)) {
    return true
  }
  if (_isManuallyBlocked(url)) {
    return false
  }
  if (isSearchEngineQueryUrl(url)) {
    return false
  }
  return (
    isMemorable(url) &&
    _isArticleUrl(new URL(url)) &&
    isProbablyReaderable(document_)
  )
}
