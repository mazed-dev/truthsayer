import { isMemorable } from './unmemorable'
import { isSearchEngineQueryUrl } from './searchEngineQuery'
import { log } from 'armoury'
import { isProbablyReaderable } from '@mozilla/readability'
import {
  shouldUseCustomExtractorsFor,
  extractPageTextCustom,
} from '../webPageContent'

const kHomepage: RegExp[] = [
  /^\/?$/, // empty path
  /^\/index.html$/,
  /^\/index.php$/,
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
  /\/(login|signin|signup|auth)\/?/i,
  // Block pages seen during PR creation where two branches are compared
  /github\.com\/.*\/compare\/.*/,
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

const kPageNotFoundTitles: RegExp[] = [
  /.*error 404.*/,
  /.*error 403.*/,
  /.*error page.*/,
  /.*page not found.*/,
  /.*page can't be found.*/,
  /.*page cannot be found.*/,
]

export function _isTitleOfNotFoundPage(title?: string | null): boolean {
  if (title == null) {
    return false
  }

  const normalizedTitle = title.toLowerCase()

  if (kPageNotFoundTitles.find((r: RegExp) => normalizedTitle.match(r))) {
    log.debug(
      `Document title ${title} indicates it's a "page not found" page, should not be autosaved`
    )
    return true
  }
  return false
}

function isPageReaderable(url: string, document_: Document): boolean {
  // Minimal length of content in characters. Experimental value, selected based
  // on results for very small pages. Feel free to adjust if needed.
  const minContentLength = 300
  if (shouldUseCustomExtractorsFor(url)) {
    const text = extractPageTextCustom(document_, url)
    log.debug('isPageReaderable - custom', text.length, text)
    return text.length >= minContentLength
  } else {
    return isProbablyReaderable(document_, { minContentLength })
  }
}

export function isPageAutosaveable(url: string, document_?: Document): boolean {
  if (_isManuallyAllowed(url)) {
    log.debug('Autosaving is manually allowed for', url)
    return true
  }
  if (_isManuallyBlocked(url)) {
    log.debug('Autosaving is manually blocked for', url)
    return false
  }
  if (isSearchEngineQueryUrl(url)) {
    log.debug('Search engine URL - autosaving is allowed for', url)
    return false
  }
  if (!isMemorable(url)) {
    log.debug('Not memorable - autosaving is blocked for', url)
    return false
  }
  if (!_isArticleUrl(new URL(url))) {
    log.debug('Not an article - autosaving is blocked for', url)
    return false
  }
  if (document_ == null) {
    log.debug('There is no document - autosaving is blocked for', url)
    return false
  }
  if (_isTitleOfNotFoundPage(document_.title)) {
    log.debug('The page is likely 404 - autosaving is blocked for', url)
    return false
  }
  const isPageProbablyReaderable = isPageReaderable(url, document_)
  log.debug('The page is readable ->', isPageProbablyReaderable)
  return isPageProbablyReaderable
}
