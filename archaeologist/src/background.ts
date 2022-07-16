import * as badge from './badge/badge'
import * as omnibox from './omnibox/omnibox'
import * as browserBookmarks from './browser-bookmarks/bookmarks'
import {
  ToPopUp,
  ToContent,
  FromPopUp,
  FromContent,
  ToBackground,
} from './message/types'

import browser from 'webextension-polyfill'
import { log, isAbortError, genOriginId } from 'armoury'
import { Knocker, TNode, authCookie, smuggler, OriginHash } from 'smuggler-api'
import { updateContent } from './background/updateContent'
import { savePage, savePageQuote } from './background/savePage'

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
  if (tab == null) {
    return
  }
  const { id, url } = tab
  if (url == null) {
    return
  }
  const { id: originId, stableUrl } = await genOriginId(url)
  await checkOriginIdAndUpdatePageStatus(id, stableUrl, originId)
}

// Periodically renew auth token using Knocker
//
// Time period in milliseonds (~17 minutes) is a magic prime number to avoid too
// many weird correlations with running Knocker in web app.
const _kRenewTokenTimePeriodInSeconds = 1062599
const _authKnocker = new Knocker(_kRenewTokenTimePeriodInSeconds)
_authKnocker.start()

async function sendAuthStatus() {
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
  const status = authCookie.checkRawValue(cookie?.value || null)
  badge.setActive(status)

  try {
    await ToPopUp.sendMessage({ type: 'AUTH_STATUS', status })
  } catch (err) {
    if (!isAbortError(err)) {
      log.exception(err, 'Could not send auth status')
    }
  }
}

async function checkOriginIdAndUpdatePageStatus(
  tabId: number | undefined,
  url: string,
  originId?: OriginHash
) {
  if (originId == null) {
    const unmemorable = true
    await updateContent('reset', [], undefined, tabId, unmemorable)
    return
  }
  let nodes
  try {
    nodes = await smuggler.node.lookup({ url })
  } catch (err) {
    log.debug('Lookup by origin ID failed, consider page as non saved', err)
    return
  }
  let bookmark: TNode | undefined = undefined
  let quotes: TNode[] = []
  for (const node of nodes) {
    if (node.isWebBookmark()) {
      bookmark = node
    } else if (node.isWebQuote()) {
      quotes.push(node)
    }
  }
  await updateContent('reset', quotes, bookmark, tabId)
}

async function registerAttentionTime(
  tab: browser.Tabs.Tab | null,
  message: FromContent.AttentionTimeChunk
): Promise<void> {
  if (tab?.id == null) {
    log.debug("Can't register attention time for a tab: ", tab)
    return
  }
  const { totalSeconds, totalSecondsEstimation } = message
  log.debug(
    'Register Attention Time',
    tab,
    totalSeconds,
    totalSecondsEstimation
  )
  // TODO: upsert attention time to smuggler here, see
  // https://github.com/Thread-knowledge/smuggler/pull/76
  if (totalSeconds >= totalSecondsEstimation) {
    log.debug(
      'Enough attention time for the tab, bookmark it',
      totalSeconds,
      tab
    )
    const response: FromContent.SavePageResponse = await ToContent.sendMessage(
      tab.id,
      { type: 'REQUEST_PAGE_CONTENT' }
    )
    const { url, content, originId, quoteNids } = response
    await savePage(url, originId, quoteNids, content, tab.id)
  }
}

async function handleMessageFromContent(
  message: FromContent.Message,
  sender: browser.Runtime.MessageSender
) {
  const tab = sender.tab ?? (await getActiveTab())
  log.debug('Get message from content', message, tab)
  switch (message.type) {
    case 'ATTENTION_TIME_CHUNK':
      await registerAttentionTime(tab, message)
      break
    default:
      throw new Error(
        `background received msg from content of unknown type, message: ${JSON.stringify(
          message
        )}`
      )
  }
}

async function handleMessageFromPopup(message: FromPopUp.Message) {
  // process is not defined in browsers extensions - use it to set up axios
  const activeTab = await getActiveTab()
  log.debug('Get message from popup', message, activeTab)
  switch (message.type) {
    case 'REQUEST_PAGE_TO_SAVE':
      const tabId = activeTab?.id
      if (tabId == null) {
        return
      }
      const response: FromContent.SavePageResponse =
        await ToContent.sendMessage(tabId, { type: 'REQUEST_PAGE_CONTENT' })
      const { url, content, originId, quoteNids } = response
      await savePage(url, originId, quoteNids, content, tabId)
      break
    case 'REQUEST_PAGE_IN_ACTIVE_TAB_STATUS':
      await requestPageSavedStatus(activeTab)
      break
    case 'REQUEST_AUTH_STATUS':
      await sendAuthStatus()
      break
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
    message: ToBackground.Message,
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
    _tabId: number,
    changeInfo: browser.Tabs.OnUpdatedChangeInfoType,
    tab: browser.Tabs.Tab
  ) => {
    if (
      !tab.incognito &&
      tab.url &&
      !tab.hidden &&
      changeInfo.status === 'complete'
    ) {
      // Request page saved status on new non-incognito page loading
      await requestPageSavedStatus(tab)
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
