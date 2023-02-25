import { errorise, log } from 'armoury'
import { StorageApi } from 'smuggler-api'
import browser, { Tabs } from 'webextension-polyfill'
import { isPageAutosaveable } from '../../content/extractor/url/autosaveable'
import { FromContent, ToContent } from '../../message/types'
import { TabLoad } from '../../tabLoad'
import { saveWebPage } from '../savePage'

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
  let response:
    | FromContent.SavePageResponse
    | FromContent.PageAlreadySavedResponse
    | FromContent.PageNotWorthSavingResponse
    | null = null
  try {
    response = await ToContent.sendMessage(tabId, requestContent)
  } catch (firstError) {
    try {
      await Promise.all([browser.tabs.reload(tabId), TabLoad.monitor(tabId)])
      response = await ToContent.sendMessage(tabId, requestContent)
    } catch (secondError) {
      throw new Error(
        `Failed to get contents of a tab. Tried to reload it to make ` +
          `sure content script has been loaded, but that lead to another error. ` +
          `Error1 = ${errorise(firstError).message}, ` +
          `Error2 = ${errorise(secondError).message}`
      )
    }
  }
  return response
}

/**
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
