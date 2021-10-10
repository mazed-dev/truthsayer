/**
 * Extensions that read or write to web pages utilize a
 * [content script](https://developer.chrome.com/docs/extensions/mv3/content_scripts/).
 * The content script contains JavaScript that executes in the contexts of a
 * page that has been loaded into the browser. Content scripts read and modify
 * the DOM of web pages the browser visits.
 */
import './content.css'
import { MessageTypes } from './types'
import { exctractPageContent } from './webPageContent'

async function _readPageContent() {
  const html = document.getElementsByTagName('html')
  const url = document.URL || document.documentURI
  const baseURL = `${window.location.protocol}//${window.location.host}`
  const content = exctractPageContent(html[0], baseURL)
  chrome.runtime.sendMessage({
    type: 'SAVE_PAGE',
    content,
    url,
  })
}

chrome.runtime.onMessage.addListener((message: MessageTypes) => {
  switch (message.type) {
    case 'REQ_SAVE_PAGE':
      _readPageContent()
      break
    default:
      break
  }
})
