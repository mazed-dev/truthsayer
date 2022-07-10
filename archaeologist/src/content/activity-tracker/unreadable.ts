import { isMemorable } from '../extractor/unmemorable'
import { log } from 'armoury'

import { isProbablyReaderable } from '@mozilla/readability'

const kTools: RegExp[] = [/.*\.google\.com/]
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
  if (
    kTools.find((r: RegExp) => {
      return url.hostname.match(r)
    })
  ) {
    log.debug(`The page ${url.hostname} is a tool - unreadable`)
    return false
  }
  return true
}

export function isPageReadable(url: string, document_: Document): boolean {
  return (
    isMemorable(url) &&
    _isArticleUrl(new URL(url)) &&
    isProbablyReaderable(document_)
  )
}
