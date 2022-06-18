import { isMemorable } from '../extractor/unmemorable'
import { log } from 'armoury'

const kTools: RegExp[] = [/.*\.google\.com/]
const kHomepage: RegExp[] = [
  /^\/?$/, // empty path
  /index.html$/,
  /index.php$/,
]
function _isArticleUrl(url: URL): boolean {
  if (
    kHomepage.find((r: RegExp) => {
      return url.pathname.match(r)
    })
  ) {
    log.debug('The page is a homepage - unreadable')
    return false
  }
  if (
    kTools.find((r: RegExp) => {
      return url.hostname.match(r)
    })
  ) {
    log.debug('The page is a tool - unreadable')
    return false
  }
  return true
}

export function isPageReadable(url: string): boolean {
  return isMemorable(url) && _isArticleUrl(new URL(url))
}
