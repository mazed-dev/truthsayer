import { MessageTypes } from './message/types'
import * as badge from './badge'
import * as log from './util/log'

import { WebPageContent } from './extractor/webPageContent'

import {
  smuggler,
  makeNodeTextData,
  NodeIndexText,
  NodeExtattrs,
  authCookie,
  Knocker,
  Mime,
} from 'smuggler-api'

// To send message to popup
// chrome.runtime.sendMessage({ type: 'REQUEST_PAGE_TO_SAVE' })

/**
 * Request page to be saved. content.ts is listening for this message and
 * respond with page content message that could be saved to smuggler.
 */
const requestPageContentToSave = () => {
  log.debug('requestPageContentToSave')
  log.debug('Save page content authenticated:', authCookie.check())

  // send message to every active tab
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      log.debug('Tab', tab)
      if (tab.id && tab.active) {
        log.debug('Send to', tab)
        chrome.tabs.sendMessage(tab.id, { type: 'REQUEST_PAGE_TO_SAVE' })
      }
    })
  })
}

const savePage = (url: string, originId: number, content: WebPageContent) => {
  log.debug('Save page content', url, originId, content)
  const text = makeNodeTextData()
  // from_nid?: string
  // to_nid?: string
  const index_text: NodeIndexText = {
    plaintext: content.text,
    labels: [],
    brands: [],
    dominant_colors: [],
  }
  const extattrs: NodeExtattrs = {
    content_type: Mime.TEXT_URI_LIST,
    preview_image: null,
    title: content.title,
    description: content.description,
    lang: content.lang,
    author: content.author.join(", "),
    web: {
      url: url,
    },
    blob: null,
  }
  smuggler.node.create({
    text,
    index_text,
    extattrs,
  })
}

const _authKnocker = new Knocker(1062599)
_authKnocker.start()

const sendAuthStatus = () => {
  chrome.cookies.get(
    { url: authCookie.url, name: authCookie.name },
    (cookie: chrome.cookies.Cookie | null) => {
      const status = authCookie.checkRawValue(cookie?.value || null)
      log.debug('Got localhost x-magic-veil cookie', cookie, status)
      badge.setActive(status)
      chrome.runtime.sendMessage({ type: 'AUTH_STATUS', status })
    }
  )
}

const updateTabSavedStatus = () => {
  // TODO(akindyakov)
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

chrome.runtime.onMessage.addListener((message: MessageTypes) => {
  log.debug('chrome.runtime.onMessage.addListener - callback', message)
  // process is not defined in browsers extensions - use it to set up axios
  log.debug('background.process.env', process.env.NODE_ENV)
  log.debug(
    'background.process.env.CHROME',
    process.env.CHROME,
    process.env.FIREFOX
  )
  log.debug(
    'background.process.env.REACT_APP_*',
    process.env.REACT_APP_SMUGGLER_API_URL
  )
  fetch('http://0.0.0.0:8080/').then(function (response) {
    log.debug('Fetch /', response)
  })
  smuggler.ping().then((d) => {
    log.debug('Ping', d)
  })
  switch (message.type) {
    case 'REQUEST_PAGE_TO_SAVE':
      requestPageContentToSave()
      break
    case 'PAGE_TO_SAVE':
      const { url, content, originId } = message
      savePage(url, originId, content)
      break
    case 'REQUEST_AUTH_STATUS':
      sendAuthStatus()
      break
    case 'PAGE_ORIGIN_ID':
      updateTabSavedStatus()
      break
    default:
      break
  }
})
