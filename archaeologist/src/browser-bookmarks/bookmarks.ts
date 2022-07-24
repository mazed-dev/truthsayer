import browser from 'webextension-polyfill'
import { log } from 'armoury'
import { FromContent, ToContent } from '../message/types'
import { savePage } from '../background/savePage'

async function onCreatedEventListener(
  id: string,
  bookmark: browser.Bookmarks.BookmarkTreeNode
): Promise<void> {
  log.debug('Bookmark: on-created-event listener', id, bookmark)
  const { type, url } = bookmark
  if (type === 'bookmark' && url != null) {
    const tabs = await browser.tabs.query({ url })
    const tab = tabs.find((tab) => tab.id && tab.url)
    if (tab?.id == null) {
      throw new Error(`Request of a page content for URL ${url} failed`)
    }
    const response: FromContent.SavePageResponse = await ToContent.sendMessage(
      tab.id,
      { type: 'REQUEST_PAGE_CONTENT' }
    )
    const { url: stableUrl, content, originId, quoteNids } = response
    await savePage(stableUrl, originId, quoteNids, content)
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
