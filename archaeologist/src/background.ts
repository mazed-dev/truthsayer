import * as badge from './badge/badge'
import * as omnibox from './omnibox/omnibox'
import * as webNavigation from './web-navigation/webNavigation'
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
import { log, isAbortError, unixtime } from 'armoury'
import {
  Knocker,
  TNode,
  TotalUserActivity,
  authCookie,
  smuggler,
} from 'smuggler-api'
import { saveWebPage, savePageQuote } from './background/savePage'
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
    const pageContentResponse: FromContent.SavePageResponse =
      await ToContent.sendMessage(tab.id, { type: 'REQUEST_PAGE_CONTENT' })
    const { url, content, originId, quoteNids } = pageContentResponse
    const originTransitionsForNode = await smuggler.activity.relation.get({
      origin: { id: origin.id },
    })
    const toNids: string[] = []
    for (const relation of originTransitionsForNode.to) {
      const { nid } = relation
      if (nid != null) {
        toNids.push(nid)
      }
    }
    const fromNids: string[] = []
    for (const relation of originTransitionsForNode.from) {
      const { nid } = relation
      if (nid != null) {
        fromNids.push(nid)
      }
    }
    await saveWebPage(
      url,
      originId,
      toNids.concat(quoteNids),
      fromNids,
      content,
      tab.id
    )
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
      const { node, unmemorable } = await saveWebPage(
        url,
        originId,
        quoteNids,
        [],
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

browser.tabs.onUpdated.addListener(
  async (
    tabId: number,
    changeInfo: browser.Tabs.OnUpdatedChangeInfoType,
    tab: browser.Tabs.Tab
  ) => {
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
webNavigation.register()
