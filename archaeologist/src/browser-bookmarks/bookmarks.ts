import browser from 'webextension-polyfill'
import { log } from 'armoury'

async function onCreatedEventListener(
  id: string,
  bookmark: browser.Bookmarks.BookmarkTreeNode
): Promise<void> {
  log.debug('Bookmark: on-created-event listener', id, bookmark)
  if (bookmark.type === 'bookmark') {
  }
}

type ChangeInfo = {
  url?: string
  title: string
}
async function onChangedEventListener(
  id: string,
  changeInfo: ChangeInfo
): Promise<void> {
  log.debug('Bookmark: on-changed-event listener', id, changeInfo)
}

export function register() {
  // bookmarks listeners:
  //   - .onChanged
  //   - .onCreated
  browser.bookmarks.onCreated.addListener(onCreatedEventListener)
  browser.bookmarks.onChanged.addListener(onChangedEventListener)
  return () => {
    browser.bookmarks.onCreated.removeListener(onCreatedEventListener)
    browser.bookmarks.onChanged.removeListener(onChangedEventListener)
  }
}
