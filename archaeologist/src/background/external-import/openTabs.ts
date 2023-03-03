import { errorise, log } from 'armoury'
import { StorageApi } from 'smuggler-api'
import browser from 'webextension-polyfill'
import { isPageAutosaveable } from '../../content/extractor/url/autosaveable'
import { FromContent, ToContent } from '../../message/types'
import { calculateInitialContentState } from '../contentInit'
import { saveWebPage } from '../savePage'
import lodash from 'lodash'
import { truthsayer } from 'elementary'
import type { BackgroundActionProgress } from 'truthsayer-archaeologist-communication'

/** Tools to import to Mazed the content of currently open tabs */
export namespace OpenTabs {
  // TODO[snikitin@outlook.com] This boolean is an extremely naive tool to cancel
  // an asyncronous task. See `shouldCancelBrowserHistoryUpload` for more information.
  let shouldCancelOpenTabsUpload = false

  /**
   * @summary Upload the content of all the tabs user has currently open to Mazed.
   * @description WARNING: may refresh the tabs, a user-visible effect.
   */
  export async function uploadAll(
    storage: StorageApi,
    onProgress: (progress: BackgroundActionProgress) => Promise<void>
  ): Promise<void> {
    const reportProgress = lodash.throttle(onProgress, 1123)

    const tabs: browser.Tabs.Tab[] = await browser.tabs.query({})
    for (
      let index = 0;
      index < tabs.length && !shouldCancelOpenTabsUpload;
      index++
    ) {
      await upload(storage, tabs[index])
      reportProgress({ processed: index, total: tabs.length })
    }
    shouldCancelOpenTabsUpload = false

    reportProgress({ processed: tabs.length, total: tabs.length })
    await reportProgress.flush()
  }

  export function cancel() {
    shouldCancelOpenTabsUpload = true
  }

  async function upload(storage: StorageApi, tab: browser.Tabs.Tab) {
    if (tab.id == null || tab.url == null) {
      log.debug(
        `Attempted to upload contents of an invalid tab: ${JSON.stringify(tab)}`
      )
      return
    }

    if (truthsayer.url.belongs(tab.url)) {
      return
    }

    try {
      if (!isPageAutosaveable(tab.url)) {
        return
      }
      const response = await getTabContent(storage, tab.id, tab.url)
      if (response.type !== 'PAGE_TO_SAVE') {
        return
      }
      await saveWebPage(storage, response, { manualAction: null }, tab.id)
    } catch (reason) {
      log.error(errorise(reason).message)
    }
  }

  function contentScriptProbablyDoesntExist(error: Error) {
    return error.message.search(/receiving end does not exist/i) >= 0
  }

  async function getTabContent(
    storage: StorageApi,
    tabId: number,
    tabUrl: string
  ): Promise<
    | FromContent.SavePageResponse
    | FromContent.PageAlreadySavedResponse
    | FromContent.PageNotWorthSavingResponse
  > {
    const requestContent: ToContent.RequestPageContent = {
      type: 'REQUEST_PAGE_CONTENT',
      manualAction: false,
    }
    try {
      return await ToContent.sendMessage(tabId, requestContent)
    } catch (error) {
      // If content script doesn't exist, retry. For every other error - rethrow.
      if (!contentScriptProbablyDoesntExist(errorise(error))) {
        throw error
      }
    }
    // If content script doesn't exist, it may be that the user has opened this
    // tab before they installed archaeologist. In this case instruct the browser
    // to load content script explicitely.
    await browser.scripting.executeScript({
      target: { tabId },
      files: ['content.js'],
    })
    const initRequest = await calculateInitialContentState(
      storage,
      tabUrl,
      'passive-mode-content-app'
    )
    await ToContent.sendMessage(tabId, initRequest)
    return await ToContent.sendMessage(tabId, requestContent)
  }
}
