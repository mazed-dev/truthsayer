import browser from 'webextension-polyfill'
import { log, Timer } from 'armoury'
import { FromContent, ToContent } from '../message/types'
import { saveWebPage } from '../background/savePage'
import { NodeCreatedVia, StorageApi } from 'smuggler-api'

async function onCreatedEventListener(
  storage: StorageApi,
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
    const response:
      | FromContent.SavePageResponse
      | FromContent.PageAlreadySavedResponse
      | FromContent.PageNotWorthSavingResponse = await ToContent.sendMessage(
      tab.id,
      { type: 'REQUEST_PAGE_CONTENT', manualAction: true }
    )
    if (response.type !== 'PAGE_TO_SAVE') {
      return
    }
    const createdVia: NodeCreatedVia = { manualAction: null }
    await saveWebPage(storage, response, createdVia)
  }
}

/**
 * Browser API for naitive bookmarks
 *
 * Add listeners for:
 *  - created naitive bookmark
 */
export function register(storage: StorageApi) {
  const timer = new Timer()
  const callback = (id: string, bookmark: browser.Bookmarks.BookmarkTreeNode) =>
    onCreatedEventListener(storage, id, bookmark)
  browser.bookmarks.onCreated.addListener(callback)
  log.debug('Bookmark module is loaded', timer.elapsedSecondsPretty())
  return () => {
    browser.bookmarks.onCreated.removeListener(callback)
  }
}
