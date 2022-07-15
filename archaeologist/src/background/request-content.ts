import browser from 'webextension-polyfill'
import { ToContent } from '../message/types'
import { log, isAbortError } from 'armoury'

/**
 * Request page to be saved. content.ts is listening for this message and
 * respond with page content message that could be saved to smuggler.
 */
export async function requestPageContentToSave(tab: browser.Tabs.Tab | null) {
  const tabId = tab?.id
  if (tabId == null) {
    return
  }
  try {
    await ToContent.sendMessage(tabId, { type: 'REQUEST_PAGE_CONTENT' })
  } catch (err) {
    if (!isAbortError(err)) {
      log.exception(err)
    }
  }
}

export async function requestPageContentToSaveByUrl(url: string) {
  try {
    const tabs = await browser.tabs.query({ url })
    const tab = tabs.find((tab) => tab.id && tab.url)
    if (tab == null) {
      throw new Error(`Request of a page content for URL ${url} failed`)
    }
    await requestPageContentToSave(tab)
  } catch (err) {
    if (!isAbortError(err)) {
      log.exception(err)
    }
  }
}
