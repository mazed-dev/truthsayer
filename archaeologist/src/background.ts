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

const savePage = (url: string, originId: number, content: WebPageContent) => {
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
        sendMessageToPopUp({ type: 'SAVED_NODE', nid: resp.nid })
      }
    })
}

const requestPageInActiveTabSavedStatus = async () => {
  sendMessageToActiveTab({ type: 'REQUEST_PAGE_ORIGIN_ID' })
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
  url: string,
  originId?: number
) => {
  if (originId == null) {
    sendMessageToPopUp({ type: 'SAVED_NODE', unmemorable: true })
    return
  }
  const iter = smuggler.node.slice({
    start_time: 0, // since the beginning of time
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
      sendMessageToPopUp({ type: 'SAVED_NODE', nid: node.nid })
      return
    }
  }
  sendMessageToPopUp({ type: 'SAVED_NODE' })
}

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

chrome.runtime.onMessage.addListener((message: MessageType) => {
  log.debug('chrome.runtime.onMessage listener', message)
  // process is not defined in browsers extensions - use it to set up axios
  switch (message.type) {
    case 'REQUEST_PAGE_TO_SAVE':
      requestPageContentToSave()
      break
    case 'REQUEST_SAVED_NODE':
      requestPageInActiveTabSavedStatus()
      break
    case 'PAGE_TO_SAVE':
      const { url, content, originId } = message
      savePage(url, originId, content)
      break
    case 'REQUEST_AUTH_STATUS':
      sendAuthStatus()
      break
    case 'PAGE_ORIGIN_ID':
      {
        const { url, originId } = message
        checkOriginIdAndUpdatePageStatus(url, originId)
      }
      break
    default:
      break
  }
})
