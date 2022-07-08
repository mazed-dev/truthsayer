import { requestPageContentToSaveByUrl } from '../background/request-content'

import browser from 'webextension-polyfill'
import { log } from 'armoury'

async function onCreatedEventListener(
  id: string,
  bookmark: browser.Bookmarks.BookmarkTreeNode
): Promise<void> {
  log.debug('Bookmark: on-created-event listener', id, bookmark)
  const { type, url } = bookmark
  if (type === 'bookmark' && url != null) {
    requestPageContentToSaveByUrl(url)
  }
}

/**
 * Browser API for naitive bookmarks
 *
 * Add listeners for:
 *  - created naitive bookmark
 */
export function register() {
  browser.bookmarks.onCreated.addListener(onCreatedEventListener)
  return () => {
    browser.bookmarks.onCreated.removeListener(onCreatedEventListener)
  }
}
