import { errorise, log } from 'armoury'
import { StorageApi } from 'smuggler-api'
import browser from 'webextension-polyfill'
import { isPageAutosaveable } from '../../content/extractor/url/autosaveable'
import { FromContent, ToContent } from '../../message/types'
import { TabLoad } from '../../tabLoad'
import { saveWebPage } from '../savePage'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * @summary Upload the content of all the tabs user has currently open to Mazed.
 * @description WARNING: may refresh the tabs, a user-visible effect.
 * @return number of successfully uploaded tabs
 */
export async function uploadAllOpenTabs(storage: StorageApi): Promise<number> {
  const tabs: browser.Tabs.Tab[] = await browser.tabs.query({})
  let numOfUploaded = 0
  for (const tab of tabs) {
    if (tab.id == null || tab.url == null) {
      log.debug(
        `Attempted to upload contents of an invalid tab: ${JSON.stringify(tab)}`
      )
      continue
    }

    try {
      if (!isPageAutosaveable(tab.url)) {
        continue
      }
      const response = await getTabContent(tab.id)
      if (response.type !== 'PAGE_TO_SAVE') {
        continue
      }
      await saveWebPage(storage, response, { manualAction: null }, tab.id)
      ++numOfUploaded
    } catch (reason) {
      log.error(errorise(reason).message)
      continue
    }
  }
  return numOfUploaded
}

function contentScriptProbablyDoesntExist(error: Error) {
  return error.message.search(/receiving end does not exist/i) >= 0
}

async function getTabContent(
  tabId: number
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
  // tab before they installed archaeologist. In this case refreshing the tab
  // should load the script.
  try {
    await Promise.all([browser.tabs.reload(tabId), TabLoad.monitor(tabId)])
    return await ToContent.sendMessage(tabId, requestContent)
  } catch (error) {
    // If content script still doesn't exist, retry. For every other error - rethrow.
    if (!contentScriptProbablyDoesntExist(errorise(error))) {
      throw error
    }
  }

  // If content still doesn't exist, it might be due to TabLoad.monitor() not being
  // fully deterministic in case of dynamic pages. Sleep for a small period of time
  // as a last attempt to give content script a chance.
  await sleep(1000)
  return await ToContent.sendMessage(tabId, requestContent)
}
