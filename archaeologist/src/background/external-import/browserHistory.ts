import lodash from 'lodash'
import browser from 'webextension-polyfill'

import { genOriginId, log, unixtime } from 'armoury'
import type {
  Ack,
  NodeCreatedVia,
  ResourceVisit,
  StorageApi,
  TotalUserActivity,
  UserExternalPipelineId,
  UserExternalPipelineIngestionProgress,
} from 'smuggler-api'
import type {
  BrowserHistoryUploadMode,
  BrowserHistoryUploadProgress,
} from '../../message/types'
import { FromContent, ToContent } from '../../message/types'

import { isReadyToBeAutoSaved } from '../pageAutoSaving'
import { saveWebPage } from '../savePage'
import { isPageAutosaveable } from '../../content/extractor/url/autosaveable'
import { TabLoad } from '../../tabLoad'
import { calculateInitialContentState } from '../contentState'

export namespace BrowserHistoryUpload {
  // TODO[snikitin@outlook.com] This boolean is an extremely naive tool to cancel
  // an asyncronous task. In general AbortController would have been used instead
  // (see https://medium.com/@bramus/cancel-a-javascript-promise-with-abortcontroller-3540cbbda0a9)
  // but if controller is passed across the popup/background or content/background
  // boundary it stops working.
  //
  // One of the weaknesses of this boolean is it's a global, so it may work in happy
  // case when there is just one browser history upload job running, but if for any
  // reason there are more, then attempts to cancel them will lead to unexpected results.
  //
  // Another weakness is the boolean state is completely disconneted from whether or not
  // browser history upload is actually in progress.
  let shouldCancelBrowserHistoryUpload = false

  export function cancel() {
    shouldCancelBrowserHistoryUpload = true
  }

  /**
   * Same as browser.History.HistoryItem, but with certain fields important
   * to archaeologist validated
   */
  type ValidHistoryItem = Omit<
    browser.History.HistoryItem,
    'url' | 'lastVisitTime'
  > &
    Required<Pick<browser.History.HistoryItem, 'url' | 'lastVisitTime'>>
  function isValidHistoryItem(
    item: browser.History.HistoryItem
  ): item is ValidHistoryItem {
    return item.url != null && item.lastVisitTime != null
  }

  export async function upload(
    storage: StorageApi,
    mode: BrowserHistoryUploadMode,
    onProgress: (progress: BrowserHistoryUploadProgress) => Promise<void>
  ) {
    const reportProgress = lodash.throttle(onProgress, 1123)

    const epid = externalPipelineId()
    const currentProgress = await storage.external.ingestion.get({ epid })

    log.debug('Progress until now:', currentProgress)

    const advanceIngestionProgress = lodash.throttle(
      // The implementation of this function mustn't throw
      // due to the expectations with which it gets used later
      mode.mode !== 'untracked'
        ? async (date: Date) => {
            const ingested_until: number = unixtime.from(date)
            const nack: Ack = { ack: false }
            return storage.external.ingestion
              .advance({ epid, new_progress: { ingested_until } })
              .catch(() => nack)
          }
        : async (_: Date) => {},
      1123
    )

    const items: ValidHistoryItem[] = (
      await browser.history.search(toHistorySearchQuery(mode, currentProgress))
    )
      .filter(isValidHistoryItem)
      .filter((item) => isPageAutosaveable(item.url))
      // NOTE: With Chromium at least the output of `browser.history.search`
      // is already in the order from "pages that hasn't been visited the longest"
      // to "most recently visited". However `browser.history.search` doesn't seem
      // to provide any guarantees about it. Since logic which relies on
      // `storage.thirdparty.fs.progress` would break under different ordering,
      // explicit sorting is added as a safeguard
      .sort(sortWithOldestLastVisitAtEnd)

    for (
      let index = 0;
      index < items.length && !shouldCancelBrowserHistoryUpload;
      await advanceIngestionProgress(new Date(items[index].lastVisitTime)),
        reportProgress({ processed: index + 1, total: items.length }),
        index++
    ) {
      const item: ValidHistoryItem = items[index]
      try {
        const total: TotalUserActivity = await storage.activity.external.add({
          origin: genOriginId(item.url),
          activity: {
            visit: {
              visits: await historyVisitsOf(item.url),
              reported_by: epid,
            },
          },
        })
        if (!isReadyToBeAutoSaved(total, 0)) {
          continue
        }

        const resp = await getPageContentViaTemporaryTab(storage, item.url)
        if (resp.type !== 'PAGE_TO_SAVE') {
          continue
        }
        const createdVia: NodeCreatedVia = { autoIngestion: epid }
        const visitedAt: unixtime.Type = item.lastVisitTime
        await saveWebPage(storage, resp, createdVia, undefined, visitedAt)
      } catch (err) {
        log.error(`Failed to process ${item.url} during history upload: ${err}`)
      }
    }
    shouldCancelBrowserHistoryUpload = false

    reportProgress({ processed: items.length, total: items.length })
    reportProgress.flush()
    await advanceIngestionProgress.flush()
  }

  function toHistorySearchQuery(
    mode: BrowserHistoryUploadMode,
    currentProgress: UserExternalPipelineIngestionProgress
  ): browser.History.SearchQueryType {
    switch (mode.mode) {
      case 'resumable': {
        return {
          // TODO[snikitin@outlook.com] Such a naive implementation which queries
          // the entire history at once may consume too much memory for users
          // with years of browser history.
          // A more iterative implementation is difficult to implement due the
          // assymetry of the API - the inputs allow to restrict how visits
          // will be searched, but output includes web pages instead of visits.
          endTime: historyDateCompat(new Date()),
          startTime: historyDateCompat(
            // NOTE: 'startTime' of 'browser.history.search' is an inclusive boundary
            // which requires an increment by 1 to avoid getting edge items multiple
            // times between runs of this function
            unixtime.toDate(currentProgress.ingested_until + 1)
          ),
          maxResults: 1000000,
          text: '',
        }
      }
      case 'untracked': {
        return {
          endTime: historyDateCompat(unixtime.toDate(mode.unixtime.end)),
          startTime: historyDateCompat(unixtime.toDate(mode.unixtime.start)),
          maxResults: 1000000,
          text: '',
        }
      }
    }
  }

  async function historyVisitsOf(url: string): Promise<ResourceVisit[]> {
    const visits = await browser.history.getVisits({ url })
    return visits.map((visit): ResourceVisit => {
      return { timestamp: unixtime.from(new Date(visit.visitTime ?? 0)) }
    })
  }

  /**
   * Convert a Date object to a format compatible with browser.history APIs
   *
   * webextension-polyfill.browser.history APIs promise to accept datetimes in
   * multiple forms, including a Date, however at least on Chromium
   * the Date version doesn't work, while milliseconds version does
   */
  function historyDateCompat(date: Date): number {
    return date.getTime()
  }

  function sortWithOldestLastVisitAtEnd(
    lhs: browser.History.HistoryItem,
    rhs: browser.History.HistoryItem
  ): number {
    if (lhs.lastVisitTime == null && rhs.lastVisitTime == null) {
      return 0
    } else if (lhs.lastVisitTime == null) {
      return -1
    } else if (rhs.lastVisitTime == null) {
      return 1
    }
    if (lhs.lastVisitTime < rhs.lastVisitTime) {
      return -1
    } else if (lhs.lastVisitTime === rhs.lastVisitTime) {
      return 0
    }
    return 1
  }

  /**
   * Browser history data on a particular device and from a particular browser
   * can be treated as a pipeline of data to be consumed. This function
   * computes @see UserExternalPipelineId for this pipeline.
   */
  export function externalPipelineId(): UserExternalPipelineId {
    // TODO [snikitin@outlook.com] User can use multiple browsers and have
    // multiple devices. Ignoring the fact that modern browsers are capable of
    // syncing history, 'pipeline_key' should be populated with something that
    // uniquely identifies both the used browser and the device.
    const browserId = 'bid'
    const deviceId = 'did'
    return {
      pipeline_key: `hist-${deviceId}-${browserId}`,
    }
  }

  async function getPageContentViaTemporaryTab(
    storage: StorageApi,
    url: string
  ): Promise<
    | FromContent.SavePageResponse
    | FromContent.PageAlreadySavedResponse
    | FromContent.PageNotWorthSavingResponse
  > {
    const startTime = new Date()
    let tab = await browser.tabs.create({ active: false, url })
    const tabId = tab.id
    if (tabId == null) {
      throw new Error(`Failed to create a temporary tab for ${url}`)
    }
    try {
      // TODO[snikitin@outlook.com] This logic is more complex than it has to be.
      // Its goals are to
      //    - check if a page hasn't been saved yet, abort if it has
      //    - fetch page's contents
      //    - if a page hasn't been saved but has quotes, fetch them as well
      // All of the useful work in these steps actually happens on the content
      // side, even though most of them are *easier* to perform within background.
      // The only step that has to involve content by definition is fetching
      // page's contents.
      // However because content does all the heavy lifting, this code
      // has to properly do the full content init. This previously lead to
      // creation of 'passive-mode-content-app', TabLoad.customise() and many
      // other bits in this function.
      //
      // Instead of doing all this it would be much easier to just fetch
      // contents from a page with a mostly uninitialised content and do the rest
      // directly in background.
      tab = await TabLoad.customise(tabId)
      if (tab.url == null) {
        throw new Error(`Can't init content in temporary tab, tab has no URL`)
      }
      const request = await calculateInitialContentState(
        storage,
        tab.url,
        'passive-mode-content-app'
      )
      await ToContent.sendMessage(tabId, request)
      return await ToContent.sendMessage(tabId, {
        type: 'REQUEST_PAGE_CONTENT',
        manualAction: false,
      })
    } finally {
      try {
        await browser.tabs.remove(tabId)
      } catch (err) {
        log.debug(`Failed to remove tab ${tab.url}: ${err}`)
      }
      const endTime = new Date()
      try {
        await browser.history.deleteRange({
          startTime: historyDateCompat(startTime),
          endTime: historyDateCompat(endTime),
        })
      } catch (err) {
        log.warning(
          `Failed to cleanup history after temporary tab ${tab.url}: ${err}`
        )
      }
    }
  }
}
