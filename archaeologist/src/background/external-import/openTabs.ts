import { errorise, log } from 'armoury'
import { StorageApi } from 'smuggler-api'
import browser from 'webextension-polyfill'
import { isPageAutosaveable } from '../../content/extractor/url/autosaveable'
import { FromContent, ToContent } from '../../message/types'
import { calculateInitialContentState } from '../contentState'
import { saveWebPage } from '../savePage'
import lodash from 'lodash'
import { truthsayer } from 'elementary'
import type { BackgroundActionProgress } from 'truthsayer-archaeologist-communication'
import { TabLoad } from '../../tabLoad'

/** Tools to import to Mazed the content of currently open tabs */
export namespace OpenTabs {
  // TODO[snikitin@outlook.com] This boolean is an extremely naive tool to cancel
  // an asyncronous task. See `shouldCancelBrowserHistoryUpload` for more information.
  let shouldCancelOpenTabsUpload = false

  /**
   * Same as browser.Tabs.Tab, but with certain fields important
   * to archaeologist validated
   */
  type ValidTab = Omit<browser.Tabs.Tab, 'id' | 'url'> &
    Required<Pick<browser.Tabs.Tab, 'id' | 'url'>>

  /**
   * @summary Upload the content of all the tabs user has currently open to Mazed.
   * @description WARNING: may refresh the tabs, a user-visible effect.
   */
  export async function uploadAll(
    storage: StorageApi,
    onProgress: (progress: BackgroundActionProgress) => Promise<void>
  ): Promise<void> {
    const reportProgress = lodash.throttle(onProgress, 1123)

    const tabs: ValidTab[] = (await browser.tabs.query({})).filter(isValidTab)
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

  async function upload(storage: StorageApi, tab: ValidTab) {
    if (truthsayer.url.belongs(tab.url)) {
      return
    }

    try {
      if (!isPageAutosaveable(tab.url)) {
        return
      }
      const response = await getTabContent(storage, tab)
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
    tab: ValidTab
  ): Promise<
    | FromContent.SavePageResponse
    | FromContent.PageAlreadySavedResponse
    | FromContent.PageNotWorthSavingResponse
  > {
    if (tab.discarded) {
      // If a tab is discarded, trying to communicate with them via
      // 'sendMessage' or `executeScript` hangs indefinitely. There doesn't seem
      // to be an "undiscard" API, so the only option is to reload a tab.
      //
      // As an example, if Edge decides to turn a tab into a "sleeping tab"
      // to conserve resources then the tab will become discarded.
      // See https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/discard
      // for more information.
      await Promise.all([browser.tabs.reload(tab.id), TabLoad.monitor(tab.id)])
    }

    const requestContent: ToContent.RequestPageContent = {
      type: 'REQUEST_PAGE_CONTENT',
      manualAction: false,
    }
    try {
      return await ToContent.sendMessage(tab.id, requestContent)
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
      target: { tabId: tab.id },
      files: ['content.js'],
    })
    const initRequest = await calculateInitialContentState(
      storage,
      tab.url,
      'passive-mode-content-app'
    )
    await ToContent.sendMessage(tab.id, initRequest)
    return await ToContent.sendMessage(tab.id, requestContent)
  }

  function isValidTab(tab: browser.Tabs.Tab): tab is ValidTab {
    return tab.id != null && tab.url != null
  }

  function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
  function timeout(ms: number, timedOutAction: string) {
    return sleep(ms).then(() => {
      throw new Error(
        `Following action timed out after ${ms / 1000} sec: '${timedOutAction}'`
      )
    })
  }
}
