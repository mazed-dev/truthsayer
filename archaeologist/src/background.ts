import * as omnibox from './omnibox/omnibox'
import * as webNavigation from './web-navigation/webNavigation'
import * as browserBookmarks from './browser-bookmarks/bookmarks'
import * as auth from './background/auth'
import { isReadyToBeAutoSaved } from './background/pageAutoSaving'
import { saveWebPage, savePageQuote } from './background/savePage'
import {
  ToPopUp,
  ToContent,
  FromPopUp,
  FromContent,
  ToBackground,
  VoidResponse,
} from './message/types'
import * as badge from './badge/badge'
import { calculateBadgeCounter } from './badge/badgeCounter'
import { isMemorable } from './content/extractor/url/unmemorable'

import { log, isAbortError, unixtime } from 'armoury'
import {
  TNode,
  TotalUserActivity,
  smuggler,
  NodeCreatedVia,
} from 'smuggler-api'

import browser from 'webextension-polyfill'

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
    const pageContentResponse: FromContent.SavePageResponse =
      await ToContent.sendMessage(tab.id, { type: 'REQUEST_PAGE_CONTENT' })
    const { url, content, originId, quoteNids } = pageContentResponse
    const createdVia: NodeCreatedVia = { autoAttentionTracking: null }
    await saveWebPage(url, originId, quoteNids, [], createdVia, content, tab.id)
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
      const createdVia: NodeCreatedVia = { manualAction: null }
      const { node, unmemorable } = await saveWebPage(
        url,
        originId,
        quoteNids,
        [],
        createdVia,
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
      const status = await auth.isAuthorised()
      badge.setActive(status)
      return { type: 'AUTH_STATUS', status }
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
    switch (message.direction) {
      case 'from-content':
        return await handleMessageFromContent(message, sender)
      case 'from-popup':
        return await handleMessageFromPopup(message)
      default:
        throw new Error(
          `background received msg of unknown direction, message: ${JSON.stringify(
            message
          )}`
        )
    }
  }
)

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
    if (!tab.incognito && tab.url && !tab.hidden) {
      if (changeInfo.status === 'complete') {
        if (!isMemorable(tab.url)) {
          return
        }
        // Request page saved status on new non-incognito page loading
        const response = await requestPageSavedStatus(tab)
        await badge.resetText(
          tabId,
          calculateBadgeCounter(response.quotes, response.bookmark)
        )
        try {
          await ToContent.sendMessage(tabId, {
            type: 'INIT_CONTENT_AUGMENTATION_REQUEST',
            quotes: response.quotes.map((node) => node.toJson()),
            bookmark: response.bookmark?.toJson(),
            mode: 'active-mode-content-app',
          })
        } catch (err) {
          if (!isAbortError(err)) {
            log.exception(err)
          }
        }
      }
    }
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

auth.register()
browserBookmarks.register()
omnibox.register()
webNavigation.register()
