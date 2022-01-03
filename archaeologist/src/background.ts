import { MessageType } from './message/types'
import * as badge from './badge'
import * as log from './util/log'

import { WebPageContent } from './extractor/webPageContent'

import {
  smuggler,
  makeNodeTextData,
  NodeType,
  NodeIndexText,
  NodeExtattrs,
  authCookie,
  Knocker,
  Mime,
} from 'smuggler-api'

// To send message to popup
// chrome.runtime.sendMessage({ type: 'REQUEST_PAGE_TO_SAVE' })

function sendMessageToPopUp(message: MessageType) {
  log.debug('sendMessageToPopUp', message)
  chrome.runtime.sendMessage(message)
}

function sendMessageToActiveTab(message: MessageType) {
  // Send message to every active tab
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (tab.id && tab.active) {
        chrome.tabs.sendMessage(tab.id, message)
      }
    })
  })
}

/**
 * Request page to be saved. content.ts is listening for this message and
 * respond with page content message that could be saved to smuggler.
 */
const requestPageContentToSave = () => {
  sendMessageToActiveTab({ type: 'REQUEST_PAGE_TO_SAVE' })
}

function updatePageSavedStatus(
  nid: string | null,
  tabId?: number,
  unmemorable?: true
): void {
  if (nid) {
    sendMessageToPopUp({ type: 'SAVED_NODE', nid })
    badge.resetText(tabId, '1')
  } else if (unmemorable) {
    sendMessageToPopUp({ type: 'SAVED_NODE', unmemorable: true })
    badge.resetText(tabId)
  } else {
    sendMessageToPopUp({ type: 'SAVED_NODE' })
    badge.resetText(tabId)
  }
}

const savePage = (
  url: string,
  originId: number,
  content: WebPageContent,
  tabId?: number
) => {
  log.debug('Save page content', NodeType.Url, url, originId, content)
  const text = makeNodeTextData()
  const index_text: NodeIndexText = {
    plaintext: content.text,
    labels: [],
    brands: [],
    dominant_colors: [],
  }
  const extattrs: NodeExtattrs = {
    content_type: Mime.TEXT_URI_LIST,
    preview_image: content.image,
    title: content.title,
    description: content.description,
    lang: content.lang,
    author: content.author.join(', '),
    web: {
      url: url,
    },
    blob: null,
  }
  smuggler.node
    .create({
      text,
      index_text,
      extattrs,
      ntype: NodeType.Url,
      origin: {
        id: originId,
      },
    })
    .then((resp) => {
      if (resp) {
        updatePageSavedStatus(resp.nid, tabId)
      }
    })
}

const requestPageSavedStatus = (tabId?: number) => {
  const message: MessageType = { type: 'REQUEST_PAGE_ORIGIN_ID' }
  if (tabId == null) {
    sendMessageToActiveTab(message)
  } else {
    chrome.tabs.sendMessage(tabId, message)
  }
}

// Periodically renew auth token using Knocker
//
// Time period in milliseonds (~17 minutes) is a magic prime number to avoid too
// many weird correlations with running Knocker in web app.
const _kRenewTokenTimePeriodInSeconds = 1062599
const _authKnocker = new Knocker(_kRenewTokenTimePeriodInSeconds)
_authKnocker.start()

const sendAuthStatus = () => {
  chrome.cookies.get(
    { url: authCookie.url, name: authCookie.name },
    (cookie: chrome.cookies.Cookie | null) => {
      const status = authCookie.checkRawValue(cookie?.value || null)
      log.debug('Got localhost x-magic-veil cookie', cookie, status)
      badge.setActive(status)
      sendMessageToPopUp({ type: 'AUTH_STATUS', status })
    }
  )
}

const checkOriginIdAndUpdatePageStatus = async (
  tabId: number | undefined,
  url: string,
  originId?: number
) => {
  if (originId == null) {
    const unmemorable = true
    updatePageSavedStatus(null, tabId, unmemorable)
    return
  }
  const iter = smuggler.node.slice({
    start_time: 0, // since the beginning of time
    bucket_time_size: 366 * 24 * 60 * 60,
    origin: {
      id: originId,
    },
  })
  for (;;) {
    const node = await iter.next()
    if (!node) {
      break
    }
    if (node.isWebBookmark() && node.extattrs?.web?.url === url) {
      updatePageSavedStatus(node.nid, tabId)
      return
    }
  }
  updatePageSavedStatus(null, tabId)
}

chrome.tabs.onUpdated.addListener(
  (
    tabId: number,
    changeInfo: chrome.tabs.TabChangeInfo,
    tab: chrome.tabs.Tab
  ) => {
    if (!tab.incognito && changeInfo.status === 'complete') {
      requestPageSavedStatus(tabId)
    }
  }
)

chrome.cookies.onChanged.addListener((info) => {
  const { value, name, domain } = info.cookie
  if (domain === authCookie.domain && name === authCookie.name) {
    const status = authCookie.checkRawValue(value || null)
    badge.setActive(status)
    if (status) {
      _authKnocker.start()
    } else {
      _authKnocker.abort()
    }
  }
})

chrome.runtime.onMessage.addListener(
  (message: MessageType, sender: chrome.runtime.MessageSender) => {
    log.debug('chrome.runtime.onMessage listener', message, sender)
    // process is not defined in browsers extensions - use it to set up axios
    switch (message.type) {
      case 'REQUEST_PAGE_TO_SAVE':
        requestPageContentToSave()
        break
      case 'REQUEST_SAVED_NODE':
        requestPageSavedStatus()
        break
      case 'PAGE_TO_SAVE':
        const { url, content, originId } = message
        const tabId = sender.tab?.id
        savePage(url, originId, content, tabId)
        break
      case 'REQUEST_AUTH_STATUS':
        sendAuthStatus()
        break
      case 'PAGE_ORIGIN_ID':
        {
          const { url, originId } = message
          const tabId = sender.tab?.id
          checkOriginIdAndUpdatePageStatus(tabId, url, originId)
        }
        break
      default:
        break
    }
  }
)
