import { isMemorable } from './unmemorable'
import { isSearchEngineQueryUrl } from './searchEngineQuery'
import { log } from 'armoury'
import { isPageTextWorthReading } from '../webPageContent'

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
  // Block saving from web email, because common email all the infinite replies
  // and forwards generate enormous number of embedding per single email. Until
  // we fix it, disabling autosaving from Gmail/Outlook.
  /mail\.google\.com\/mail\//,
  /outlook\.live\.com\/mail\//,
]
const kAllowlist: RegExp[] = []
/**
 * Urls blocked by Foreword dev team, this is a hack to hardcode usage of activity
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
    // A null document is intentionally not treated as an error -- if it was an
    // error then we'd change the type signature from `Document | undefined` to
    // just `Document`.
    // Instead, an option to call this helper without a document is provided
    // for workflows where a URL has not been opened by a user, but a preliminary
    // 'savability' check is useful. Browser history import is an example of such
    // a workflow.
    return true
  }
  if (_isTitleOfNotFoundPage(document_.title)) {
    log.debug('The page is likely 404 - autosaving is blocked for', url)
    return false
  }
  const isPageProbablyReaderable = isPageTextWorthReading(document_, url)
  log.debug('The page is readable ->', isPageProbablyReaderable)
  return isPageProbablyReaderable
}
