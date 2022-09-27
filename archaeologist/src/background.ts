import * as badge from './badge/badge'
import * as omnibox from './omnibox/omnibox'
import * as browserBookmarks from './browser-bookmarks/bookmarks'
import * as auth from './background/auth'
import {
  ToPopUp,
  ToContent,
  FromPopUp,
  FromContent,
  ToBackground,
  VoidResponse,
  ContentAppOperationMode,
} from './message/types'

import browser from 'webextension-polyfill'
import { log, isAbortError, genOriginId, unixtime } from 'armoury'
import {
  TNode,
  TotalUserActivity,
  ResourceVisit,
  smuggler,
  UserExternalPipelineId,
  NodeCreatedVia,
} from 'smuggler-api'
import { savePage, savePageQuote } from './background/savePage'
import { isReadyToBeAutoSaved } from './background/pageAutoSaving'
import { calculateBadgeCounter } from './badge/badgeCounter'
import { isMemorable } from './content/extractor/unmemorable'
import { isPageAutosaveable } from './content/activity-tracker/autosaveable'
import lodash from 'lodash'
import { BrowserHistoryUploadProgress } from './background/browserHistoryUploadProgress'

async function getActiveTab(): Promise<browser.Tabs.Tab | null> {
  try {
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
    })
    const tab = tabs.find((tab) => {
      return tab.id && tab.url && tab.active
    })
    return tab || null
  } catch (err) {
    if (!isAbortError(err)) {
      log.exception(err)
    }
  }
  return null
}

async function requestPageSavedStatus(url: string | undefined) {
  let quotes: TNode[] = []
  if (url == null) {
    return { quotes, unmemorable: false }
  }
  if (!isMemorable(url)) {
    return { quotes, unmemorable: true }
  }
  let nodes
  try {
    nodes = await smuggler.node.lookup({ url })
  } catch (err) {
    log.debug('Lookup by origin ID failed, consider page as non saved', err)
    return { quotes, unmemorable: false }
  }
  let bookmark: TNode | undefined = undefined
  for (const node of nodes) {
    if (node.isWebBookmark()) {
      bookmark = node
    } else if (node.isWebQuote()) {
      quotes.push(node)
    }
  }
  return { quotes, bookmark }
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

async function registerAttentionTime(
  tab: browser.Tabs.Tab | null,
  message: FromContent.AttentionTimeChunk
): Promise<void> {
  if (tab?.id == null) {
    log.debug("Can't register attention time for a tab: ", tab)
    return
  }
  const { totalSecondsEstimation, deltaSeconds, origin } = message
  log.debug('Register Attention Time', tab, totalSecondsEstimation)
  let total: TotalUserActivity
  try {
    total = await smuggler.activity.external.add(
      { id: origin.id },
      {
        seconds: deltaSeconds,
        timestamp: unixtime.now(),
      }
    )
  } catch (err) {
    if (!isAbortError(err)) {
      log.exception(err, 'Could not register external activity')
    }
    return
  }
  if (isReadyToBeAutoSaved(total, totalSecondsEstimation)) {
    const response:
      | FromContent.SavePageResponse
      | FromContent.PageAlreadySavedResponse = await ToContent.sendMessage(
      tab.id,
      { type: 'REQUEST_PAGE_CONTENT' }
    )
    if (response.type === 'PAGE_ALREADY_SAVED') {
      return
    }
    const { url, content, originId, quoteNids } = response
    const createdVia: NodeCreatedVia = { autoAttentionTracking: null }
    await savePage(url, originId, quoteNids, createdVia, content, tab.id)
  }
}

async function getPageContentViaTemporaryTab(
  url: string
): Promise<
  FromContent.SavePageResponse | FromContent.PageAlreadySavedResponse
> {
  const startTime = new Date()
  const tab = await browser.tabs.create({
    active: false,
    url,
  })
  if (tab.id == null) {
    throw new Error(`Failed to create a temporary tab for ${url}`)
  }
  try {
    await TabLoadCompletion.takeOverInit(tab.id)
    await initMazedPartsOfTab(tab, 'passive-mode-content-app')
    return await ToContent.sendMessage(tab.id, {
      type: 'REQUEST_PAGE_CONTENT',
    })
  } finally {
    try {
      await browser.tabs.remove(tab.id)
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

async function handleMessageFromContent(
  message: FromContent.Request,
  sender: browser.Runtime.MessageSender
): Promise<VoidResponse> {
  const tab = sender.tab ?? (await getActiveTab())
  log.debug('Get message from content', message, tab)
  switch (message.type) {
    case 'ATTENTION_TIME_CHUNK':
      await registerAttentionTime(tab, message)
      return { type: 'VOID_RESPONSE' }
    default:
      throw new Error(
        `background received msg from content of unknown type, message: ${JSON.stringify(
          message
        )}`
      )
  }
}

/**
 * Browser history data on a particular device and from a particular browser
 * can be treated as a pipeline of data to be consumed. This function
 * computes @see UserExternalPipelineId for this pipeline.
 */
function idOfBrowserHistoryOnThisDeviceAsExternalPipeline(): UserExternalPipelineId {
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

async function uploadBrowserHistory() {
  const reportProgressToPopup = lodash.throttle(
    (progress: BrowserHistoryUploadProgress) => {
      ToPopUp.sendMessage({
        type: 'REPORT_BROWSER_HISTORY_UPLOAD_PROGRESS',
        newState: progress,
      })
    },
    1123
  )

  const epid = idOfBrowserHistoryOnThisDeviceAsExternalPipeline()
  const currentProgress = await smuggler.external.ingestion.get(epid)

  log.debug(`Progress until now: ${currentProgress.ingested_until}`)

  const advanceIngestionProgress = lodash.throttle(async (date: Date) => {
    return smuggler.external.ingestion.advance(epid, {
      ingested_until: unixtime.from(date),
    })
  }, 1123)

  const items: browser.History.HistoryItem[] = await browser.history.search({
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
  })
  // NOTE: With Chromium at least the output of `browser.history.search`
  // is already in the order from "pages that hasn't been visited the longest"
  // to "most recently visited". However `browser.history.search` doesn't seem
  // to provide any guarantees about it. Since logic which relies on
  // `smuggler.thirdparty.fs.progress` would break under different ordering,
  // explicit sorting is added as a safeguard
  items.sort(sortWithOldestLastVisitAtEnd)

  const badgeActivityId = await badge.addActivity('H')

  for (
    let index = 0;
    index < items.length && !shouldCancelBrowserHistoryUpload;
    index++
  ) {
    const item = items[index]

    if (item.lastVisitTime == null) {
      log.warning(
        `Can't process history item ${item.url} as it doesn't have lastVisitTime set`
      )
      continue
    }

    try {
      reportProgressToPopup({
        processed: index,
        total: items.length,
      })
      await uploadSingleHistoryItem(item, epid)
      await advanceIngestionProgress(new Date(item.lastVisitTime))
    } catch (err) {
      log.error(`Failed to process ${item.url} during history upload: ${err}`)
    }
  }
  shouldCancelBrowserHistoryUpload = false

  reportProgressToPopup({
    processed: items.length,
    total: items.length,
  })
  reportProgressToPopup.flush()
  await advanceIngestionProgress.flush()
  await badge.removeActivity(badgeActivityId)
}

async function handleMessageFromPopup(
  message: FromPopUp.Request
): Promise<ToPopUp.Response> {
  // process is not defined in browsers extensions - use it to set up axios
  const activeTab = await getActiveTab()
  log.debug('Get message from popup', message, activeTab)
  switch (message.type) {
    case 'REQUEST_PAGE_TO_SAVE':
      const tabId = activeTab?.id
      if (tabId == null) {
        return { type: 'PAGE_SAVED' }
      }
      const response:
        | FromContent.SavePageResponse
        | FromContent.PageAlreadySavedResponse = await ToContent.sendMessage(
        tabId,
        { type: 'REQUEST_PAGE_CONTENT' }
      )
      if (response.type === 'PAGE_ALREADY_SAVED') {
        return { type: 'PAGE_SAVED' }
      }
      const { url, content, originId, quoteNids } = response
      const createdVia: NodeCreatedVia = { manualAction: null }
      const { node, unmemorable } = await savePage(
        url,
        originId,
        quoteNids,
        createdVia,
        content,
        tabId
      )
      return { type: 'PAGE_SAVED', bookmark: node?.toJson(), unmemorable }
    case 'REQUEST_PAGE_IN_ACTIVE_TAB_STATUS': {
      const { quotes, bookmark, unmemorable } = await requestPageSavedStatus(
        activeTab?.url
      )
      await badge.setStatus(
        activeTab?.id,
        calculateBadgeCounter(quotes, bookmark)
      )
      return {
        type: 'UPDATE_POPUP_CARDS',
        mode: 'reset',
        quotes: quotes.map((node) => node.toJson()),
        bookmark: bookmark?.toJson(),
        unmemorable,
      }
    }
    case 'REQUEST_AUTH_STATUS':
      const status = await auth.isAuthorised()
      badge.setActive(status)
      return { type: 'AUTH_STATUS', status }
    case 'UPLOAD_BROWSER_HISTORY': {
      await uploadBrowserHistory()
      return { type: 'VOID_RESPONSE' }
    }
    case 'CANCEL_BROWSER_HISTORY_UPLOAD': {
      shouldCancelBrowserHistoryUpload = true
      return { type: 'VOID_RESPONSE' }
    }
    case 'DELETE_PREVIOUSLY_UPLOADED_BROWSER_HISTORY': {
      const numDeleted = await smuggler.node.bulkDelete({
        createdVia: {
          autoIngestion: idOfBrowserHistoryOnThisDeviceAsExternalPipeline(),
        },
      })
      return {
        type: 'DELETE_PREVIOUSLY_UPLOADED_BROWSER_HISTORY',
        numDeleted,
      }
    }
    default:
      throw new Error(
        `background received msg from popup of unknown type, message: ${JSON.stringify(
          message
        )}`
      )
  }
}

async function uploadSingleHistoryItem(
  item: browser.History.HistoryItem,
  epid: UserExternalPipelineId
) {
  if (item.url == null || !isPageAutosaveable(item.url)) {
    return
  }
  const origin = genOriginId(item.url)
  const visits = await browser.history.getVisits({ url: item.url })
  const resourceVisits: ResourceVisit[] = visits.map((visit) => {
    return { timestamp: unixtime.from(new Date(visit.visitTime ?? 0)) }
  })
  const total = await smuggler.activity.external.add(origin, resourceVisits)
  // TODO[snikitin@outlook.com] Logic inside isReadyToBeAutoSaved()
  // may need to be rewritten to support cases when there was no attention time
  // tracked
  if (isReadyToBeAutoSaved(total, 0)) {
    const response:
      | FromContent.SavePageResponse
      | FromContent.PageAlreadySavedResponse = await getPageContentViaTemporaryTab(
      item.url
    )
    if (response.type === 'PAGE_TO_SAVE') {
      const { url, content, originId, quoteNids } = response
      const createdVia: NodeCreatedVia = { autoIngestion: epid }
      await savePage(url, originId, quoteNids, createdVia, content)
    }
  }
}

browser.runtime.onMessage.addListener(
  async (
    message: ToBackground.Request,
    sender: browser.Runtime.MessageSender
  ) => {
    try {
      switch (message.direction) {
        case 'from-content':
          return await handleMessageFromContent(message, sender)
        case 'from-popup':
          return await handleMessageFromPopup(message)
        default:
      }
    } catch (error) {
      console.error(
        `Failed to process '${message.direction}' message '${message.type}', ${error}`
      )
      throw error
    }

    throw new Error(
      `background received msg of unknown direction, message: ${JSON.stringify(
        message
      )}`
    )
  }
)

namespace TabLoadCompletion {
  type Monitors = {
    [key: number /* browser.Tabs.Tab.id */]: {
      onComplete: () => void
      onAbort: (reason: string) => void
    }
  }

  const monitors: Monitors = {}
  const takeOvers: Monitors = {}

  /**
   * Returns a Promise that will be resolved as soon as the is loaded completely
   * (according to @see report() ).
   * Will not interfere with the default way web pages get loaded (as opposed to
   * @see takeOverInit() )
   */
  export function monitor(tabId: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (monitors[tabId] != null) {
        reject(
          `Tab ${tabId} is already monitored for completion by someone else`
        )
        return
      }
      if (takeOvers[tabId] != null) {
        reject(
          `Tab ${tabId} init has been taken over by someone else and it's ` +
            `load completion can't be monitored`
        )
        return
      }
      monitors[tabId] = { onComplete: resolve, onAbort: reject }
    })
  }

  /**
   * Returns a Promise that will be resolved as soon as the is loaded completely
   * (according to @see report() ).
   * Will "take over" how a web page gets initialised and skip the process used
   * by default (in contrast to @see monitor() )
   */
  export function takeOverInit(tabId: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (takeOvers[tabId] != null) {
        reject(`Tab ${tabId} init has already been taken over by someone else`)
        return
      }
      if (monitors[tabId] != null) {
        reject(
          `Tab ${tabId} init can't be taken over because someone else is already ` +
            `monitoring its load completion`
        )
        return
      }

      takeOvers[tabId] = { onComplete: resolve, onAbort: reject }
    })
  }
  /**
   * Return false if a tab is expected to be initialised through the default process.
   * Return true if initialisation was taken over by something (@see takeOverInit() )
   */
  export function initTakenOver(tabId: number): boolean {
    return takeOvers[tabId] != null
  }
  /**
   * Report that a tap with given ID has been completely loaded
   * (expected to be called based on @see browser.Tabs.OnUpdatedChangeInfoType )
   */
  export function report(tabId: number) {
    if (monitors[tabId] != null) {
      try {
        monitors[tabId].onComplete()
      } finally {
        delete monitors[tabId]
      }
    } else if (takeOvers[tabId] != null) {
      try {
        takeOvers[tabId].onComplete()
      } finally {
        delete takeOvers[tabId]
      }
    }
  }
  export function abort(tabId: number, reason: string) {
    if (monitors[tabId] != null) {
      try {
        monitors[tabId].onAbort(reason)
      } finally {
        delete monitors[tabId]
      }
    } else if (takeOvers[tabId] != null) {
      try {
        takeOvers[tabId].onAbort(reason)
      } finally {
        delete takeOvers[tabId]
      }
    }
  }
}

// NOTE: on more complex web-pages onUpdated may be invoked multiple times
// with exactly the same input parameters. So the handling code has to
// be able to handle that.
// See https://stackoverflow.com/a/18302254/3375765 for more information.
browser.tabs.onUpdated.addListener(
  async (
    tabId: number,
    changeInfo: browser.Tabs.OnUpdatedChangeInfoType,
    tab: browser.Tabs.Tab
  ) => {
    try {
      if (
        !tab.incognito &&
        !tab.hidden &&
        tab.url &&
        changeInfo.status === 'complete' &&
        !TabLoadCompletion.initTakenOver(tabId)
      ) {
        await initMazedPartsOfTab(tab, 'active-mode-content-app')

        const origin = genOriginId(tab.url)
        log.debug('Register new visit', origin.stableUrl, origin.id)
        await smuggler.activity.external.add({ id: origin.id }, [
          { timestamp: unixtime.now() },
        ])
      }
    } finally {
      if (changeInfo.status === 'complete') {
        // NOTE: if loading of a tab did complete, it is important to ensure
        // report() gets called regardless of what happens in the other parts of
        // browser.tabs.onUpdated (e.g. something throws). Otherwise any part of
        // code that waits on a TabLoadCompletion promise will wait forever.
        //
        // At the same time, it is important to call report() *after* all or most
        // of Mazed's content init has been completed so tab can be in a predictable
        // state from the perspective of Mazed code that waits for TabLoadCompletion
        TabLoadCompletion.report(tabId)
      }
    }
  }
)

async function initMazedPartsOfTab(
  tab: browser.Tabs.Tab,
  mode: ContentAppOperationMode
) {
  if (tab.id == null || tab.url == null || !isMemorable(tab.url)) {
    return
  }
  // Request page saved status on new non-incognito page loading
  const response = await requestPageSavedStatus(tab.url)
  await badge.setStatus(
    tab.id,
    calculateBadgeCounter(response.quotes, response.bookmark)
  )

  try {
    await ToContent.sendMessage(tab.id, {
      type: 'INIT_CONTENT_AUGMENTATION_REQUEST',
      quotes: response.quotes.map((node) => node.toJson()),
      bookmark: response.bookmark?.toJson(),
      mode,
    })
  } catch (err) {
    if (!isAbortError(err)) {
      // As 'REQUEST_UPDATE_CONTENT_AUGMENTATION' updates tab-specific data,
      // a failure due to premature tab closure is not a concern since there
      // is no data to update any longer
      log.warning(
        `Failed to update content augmentation for ${tab.url} tab: ${err}`
      )
    }
  }
}

browser.tabs.onRemoved.addListener(
  async (tabId: number, _removeInfo: browser.Tabs.OnRemovedRemoveInfoType) => {
    TabLoadCompletion.abort(tabId, 'Tab removed')
  }
)

const kMazedContextMenuItemId = 'selection-to-mazed-context-menu-item'
browser.contextMenus.removeAll()
browser.contextMenus.create({
  title: 'Save to Mazed',
  type: 'normal',
  id: kMazedContextMenuItemId,
  contexts: ['selection', 'editable'],
})

browser.contextMenus.onClicked.addListener(
  async (
    info: browser.Menus.OnClickData,
    tab: browser.Tabs.Tab | undefined
  ) => {
    if (info.menuItemId === kMazedContextMenuItemId) {
      if (tab?.id == null) {
        return
      }
      const { selectionText } = info
      if (selectionText == null) {
        return
      }
      try {
        const response: FromContent.GetSelectedQuoteResponse =
          await ToContent.sendMessage(tab.id, {
            type: 'REQUEST_SELECTED_WEB_QUOTE',
            text: selectionText,
          })
        const { originId, url, text, path, lang, fromNid } = response
        const createdVia: NodeCreatedVia = { manualAction: null }
        await savePageQuote(
          originId,
          { url, path, text },
          createdVia,
          lang,
          tab?.id,
          fromNid
        )
      } catch (err) {
        if (!isAbortError(err)) {
          log.exception(err)
        }
      }
    }
  }
)

omnibox.register()
browserBookmarks.register()
auth.register()
