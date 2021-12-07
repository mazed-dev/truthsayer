import { MessageTypes } from './types'
import * as log from './util/log'

import { WebPageContent } from './webPageContent'

import { smuggler, authCookie } from 'smuggler-api'

const sendSavePageRequest = () => {
  log.debug('sendSavePageRequest')
  const message = { type: 'REQ_SAVE_PAGE' }

  // send message to popup
  chrome.runtime.sendMessage(message)

  // send message to every active tab
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      log.debug('Tab', tab)
      if (tab.id && tab.active) {
        log.debug('Send to', tab)
        chrome.tabs.sendMessage(tab.id, message)
      }
    })
  })
}

const savePage = (url: string, content: WebPageContent) => {
  log.debug('Save page content', url, content)
}

let snowing = false

// Get locally stored value
chrome.storage.local.get('snowing', (res) => {
  if (res.snowing) {
    snowing = true
  } else {
    snowing = false
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
    case 'REQ_SAVE_PAGE':
      sendSavePageRequest()
      break
    case 'SAVE_PAGE':
      const { url, content } = message
      savePage(url, content)
      break
    default:
      break
  }
})
