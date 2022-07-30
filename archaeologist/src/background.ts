import * as badge from './badge/badge'
import * as omnibox from './omnibox/omnibox'
import * as browserBookmarks from './browser-bookmarks/bookmarks'
import {
  ToPopUp,
  ToContent,
  FromPopUp,
  FromContent,
  ToBackground,
  VoidResponse,
} from './message/types'

import browser from 'webextension-polyfill'
import { log, isAbortError, genOriginId, unixtime } from 'armoury'
import {
  Knocker,
  TNode,
  TotalUserActivity,
  authCookie,
  smuggler,
  ResourceVisit,
} from 'smuggler-api'
import { savePage, savePageQuote } from './background/savePage'
import { isReadyToBeAutoSaved } from './background/pageAutoSaving'
import { calculateBadgeCounter } from './badge/badgeCounter'
import { isMemorable } from './content/extractor/unmemorable'

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

async function requestPageSavedStatus(tab: browser.Tabs.Tab | null) {
  let quotes: TNode[] = []
  if (tab?.url == null) {
    return { quotes, unmemorable: false }
  }
  if (!isMemorable(tab.url)) {
    return { quotes, unmemorable: true }
  }
  let nodes
  try {
    nodes = await smuggler.node.lookup({ url: tab.url })
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

// Periodically renew auth token using Knocker
//
// Time period in milliseonds (~17 minutes) is a magic prime number to avoid too
// many weird correlations with running Knocker in web app.
const _kRenewTokenTimePeriodInSeconds = 1062599
const _authKnocker = new Knocker(_kRenewTokenTimePeriodInSeconds)
_authKnocker.start()

async function getAuthStatus() {
  const cookie = await browser.cookies
    .get({
      url: authCookie.url,
      name: authCookie.name,
    })
    .catch((err) => {
      if (!isAbortError(err)) {
        log.exception(err)
      }
      return null
    })
  return authCookie.checkRawValue(cookie?.value || null)
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
    const response: FromContent.SavePageResponse = await ToContent.sendMessage(
      tab.id,
      { type: 'REQUEST_PAGE_CONTENT' }
    )
    const { url, content, originId, quoteNids } = response
    await savePage(url, originId, quoteNids, content, tab.id)
  }
}

async function getPageContentViaTemporaryTab(
  url: string
): Promise<FromContent.SavePageResponse> {
  const startTime = new Date()
  const tab = await browser.tabs.create({
    active: false,
    url,
  })
  if (tab.id == null) {
    throw new Error(`Could not create a tab for ${url}`)
  }
  try {
    await TabLoadCompletion.monitor(tab.id)
    const response = await ToContent.sendMessage(tab.id, {
      type: 'REQUEST_PAGE_CONTENT',
    })
    return response
  } finally {
    await browser.tabs.remove(tab.id)
    const endTime = new Date()
    await browser.history.deleteRange({
      startTime: historyDateCompat(startTime),
      endTime: historyDateCompat(endTime),
    })
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
      const response: FromContent.SavePageResponse =
        await ToContent.sendMessage(tabId, { type: 'REQUEST_PAGE_CONTENT' })
      const { url, content, originId, quoteNids } = response
      const { node, unmemorable } = await savePage(
        url,
        originId,
        quoteNids,
        content,
        tabId
      )
      return { type: 'PAGE_SAVED', bookmark: node?.toJson(), unmemorable }
    case 'REQUEST_PAGE_IN_ACTIVE_TAB_STATUS': {
      const { quotes, bookmark, unmemorable } = await requestPageSavedStatus(
        activeTab
      )
      await badge.resetText(
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
      const status = await getAuthStatus()
      badge.setActive(status)
      return { type: 'AUTH_STATUS', status }
    case 'UPLOAD_BROWSER_HISTORY': {
      const items: browser.History.HistoryItem[] = await browser.history.search(
        {
          // TODO[snikitin@outlook.com] Such a naive implementation which queries
          // the entire history at once may consume too much memory for users
          // with years of browser history.
          // A more iterative implementation is difficult to implement due the
          // assymetry of the API - the inputs allow to restrict how visits
          // will be searched, but output includes web pages instead of visits.
          endTime: historyDateCompat(new Date()),
          startTime: historyDateCompat(new Date(0)),
          maxResults: 1000000,
          text: '',
        }
      )

      for (const item of items) {
        if (item.url == null) {
          continue
        }
        const origin = genOriginId(item.url)
        console.log(`querying visits for ${item.url}`)
        const visits = await browser.history.getVisits({ url: item.url })
        console.log(`mapping visits`)
        const resourceVisits: ResourceVisit[] = visits.map((visit) => {
          return { timestamp: unixtime.from(new Date(visit.visitTime ?? 0)) }
        })
        console.log(`smuggling visits`)
        const total = await smuggler.activity.external.add(
          origin,
          resourceVisits
        )
        console.log(`saving page`)

        // TODO[snikitin@outlook.com] Logic inside isReadyToBeAutoSaved()
        // may need to be rewritten to support cases when there was no attention time
        // tracked
        if (isReadyToBeAutoSaved(total, 0)) {
          const response: FromContent.SavePageResponse =
            await getPageContentViaTemporaryTab(item.url)
          const { url, content, originId, quoteNids } = response
          await savePage(url, originId, quoteNids, content)
        }
      }

      return { type: 'VOID_RESPONSE' }
    }
    default:
      throw new Error(
        `background received msg from popup of unknown type, message: ${JSON.stringify(
          message
        )}`
      )
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
        `Failed to process '${message.direction}' message '${
          message.type
        }', error = ${JSON.stringify(error)}`
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
    }
  }

  const monitors: Monitors = {}

  export function monitor(tabId: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (monitors[tabId] != null) {
        reject(
          `Tab ${tabId} is already monitored for completion by someone else`
        )
        return
      }
      monitors[tabId] = { onComplete: resolve }
    })
  }
  export function report(tabId: number) {
    if (monitors[tabId] != null) {
      monitors[tabId].onComplete()
      delete monitors[tabId]
    }
  }
}

browser.tabs.onUpdated.addListener(
  async (
    tabId: number,
    changeInfo: browser.Tabs.OnUpdatedChangeInfoType,
    tab: browser.Tabs.Tab
  ) => {
    if (changeInfo.status === 'complete') {
      TabLoadCompletion.report(tabId)
    }
    if (!tab.incognito && tab.url && !tab.hidden) {
      if (changeInfo.status === 'complete') {
        // Request page saved status on new non-incognito page loading
        const response = await requestPageSavedStatus(tab)
        await badge.resetText(
          tabId,
          calculateBadgeCounter(response.quotes, response.bookmark)
        )
        await ToContent.sendMessage(tabId, {
          type: 'REQUEST_UPDATE_CONTENT_AUGMENTATION',
          quotes: response.quotes.map((node) => node.toJson()),
          bookmark: response.bookmark?.toJson(),
          mode: 'reset',
        })
        const origin = genOriginId(tab.url)
        log.debug('Register new visit', origin.stableUrl, origin.id)
        await smuggler.activity.external.add({ id: origin.id }, [
          { timestamp: unixtime.now() },
        ])
      }
    }
  }
)

browser.cookies.onChanged.addListener(async (info) => {
  const { value, name, domain } = info.cookie
  if (domain === authCookie.domain && name === authCookie.name) {
    const status = authCookie.checkRawValue(value || null)
    await badge.setActive(status)
    if (status) {
      _authKnocker.start()
    } else {
      _authKnocker.abort()
    }
  }
})

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
        await savePageQuote(
          originId,
          { url, path, text },
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
