import { MessageType } from './message/types'
import * as badge from './badge'
import * as log from './util/log'

import browser from 'webextension-polyfill'

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
// browser.runtime.sendMessage({ type: 'REQUEST_PAGE_TO_SAVE' })

async function sendMessageToPopUp(message: MessageType) {
  log.debug('sendMessageToPopUp', message)
  await browser.runtime.sendMessage(message)
}

async function sendMessageToActiveTab(message: MessageType) {
  log.debug('sendMessageToActiveTab', message)
  // Send message to every active tab
  const tabs = await browser.tabs.query({})
  const tab = tabs.find((tab) => {
    return tab.id && tab.active
  })
  const tabId = tab?.id
  if (tabId) {
    log.debug('sendMessageToActiveTab - found active tab', message, tabId)
    await browser.tabs.sendMessage(tabId, message)
  }
  log.debug('sendMessageToActiveTab - end', message)
}

/**
 * Request page to be saved. content.ts is listening for this message and
 * respond with page content message that could be saved to smuggler.
 */
const requestPageContentToSave = async () => {
  log.debug('requestPageContentToSave')
  await sendMessageToActiveTab({ type: 'REQUEST_PAGE_TO_SAVE' })
}

async function updatePageSavedStatus(
  nid: string | null,
  tabId?: number,
  unmemorable?: true
): Promise<void> {
  if (nid) {
    await sendMessageToPopUp({ type: 'SAVED_NODE', nid })
    await badge.resetText(tabId, '1')
  } else if (unmemorable) {
    await sendMessageToPopUp({ type: 'SAVED_NODE', unmemorable: true })
    await badge.resetText(tabId)
  } else {
    await sendMessageToPopUp({ type: 'SAVED_NODE' })
    await badge.resetText(tabId)
  }
}

const savePage = async (
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
  const resp = await smuggler.node.create({
    text,
    index_text,
    extattrs,
    ntype: NodeType.Url,
    origin: {
      id: originId,
    },
  })
  if (resp) {
    await updatePageSavedStatus(resp.nid, tabId)
  }
}

const requestPageSavedStatus = async (tabId?: number) => {
  const message: MessageType = { type: 'REQUEST_PAGE_ORIGIN_ID' }
  if (tabId == null) {
    log.debug('requestPageSavedStatus 1', tabId, message)
    try {
      await sendMessageToActiveTab(message)
    } catch (err) {
      log.exception(err)
    }
  } else {
    log.debug('requestPageSavedStatus 2', tabId, message)
    try {
      await browser.tabs.sendMessage(tabId, message)
    } catch (err) {
      log.exception(err)
    }
  }
  log.debug('requestPageSavedStatus end', tabId)
}

// Periodically renew auth token using Knocker
//
// Time period in milliseonds (~17 minutes) is a magic prime number to avoid too
// many weird correlations with running Knocker in web app.
const _kRenewTokenTimePeriodInSeconds = 1062599
const _authKnocker = new Knocker(_kRenewTokenTimePeriodInSeconds)
_authKnocker.start()

const sendAuthStatus = async () => {
  const cookie = await browser.cookies.get({
    url: authCookie.url,
    name: authCookie.name,
  })
  const status = authCookie.checkRawValue(cookie?.value || null)
  log.debug('Got localhost x-magic-veil cookie', cookie, status)
  badge.setActive(status)
  await sendMessageToPopUp({ type: 'AUTH_STATUS', status })
}

const checkOriginIdAndUpdatePageStatus = async (
  tabId: number | undefined,
  url: string,
  originId?: number
) => {
  if (originId == null) {
    const unmemorable = true
    await updatePageSavedStatus(null, tabId, unmemorable)
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
      await updatePageSavedStatus(node.nid, tabId)
      return
    }
  }
  await updatePageSavedStatus(null, tabId)
}

browser.tabs.onUpdated.addListener(
  async (
    tabId: number,
    changeInfo: browser.Tabs.OnUpdatedChangeInfoType,
    tab: browser.Tabs.Tab
  ) => {
    log.debug('onUpdated listener', tabId, tab)
    if (!tab.incognito && changeInfo.status === 'complete') {
      // Request page saved status on new non-incognito page loading
      log.debug('onUpdated listener -> complete', tabId, tab)
      await requestPageSavedStatus(tabId)
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

browser.runtime.onMessage.addListener(
  async (message: MessageType, sender: browser.Runtime.MessageSender) => {
    log.debug('browser.runtime.onMessage listener', message, sender)
    // process is not defined in browsers extensions - use it to set up axios
    switch (message.type) {
      case 'REQUEST_PAGE_TO_SAVE':
        requestPageContentToSave()
        break
      case 'REQUEST_SAVED_NODE':
        await requestPageSavedStatus()
        break
      case 'PAGE_TO_SAVE':
        const { url, content, originId } = message
        const tabId = sender.tab?.id
        await savePage(url, originId, content, tabId)
        break
      case 'REQUEST_AUTH_STATUS':
        await sendAuthStatus()
        break
      case 'PAGE_ORIGIN_ID':
        {
          const { url, originId } = message
          const tabId = sender.tab?.id
          await checkOriginIdAndUpdatePageStatus(tabId, url, originId)
        }
        break
      default:
        break
    }
  }
)
