/**
 * Extensions that read or write to web pages utilize a
 * [content script](https://developer.chrome.com/docs/extensions/mv3/content_scripts/).
 * The content script contains JavaScript that executes in the contexts of a
 * page that has been loaded into the browser. Content scripts read and modify
 * the DOM of web pages the browser visits.
 */
import './content.css'
import { MessageTypes } from './message/types'
import {
  exctractPageContent,
  exctractPageUrl,
} from './extractor/webPageContent'

import { genOriginId } from './extractor/originId'

async function readPageContent() {
  const baseURL = `${window.location.protocol}//${window.location.host}`
  const content = await exctractPageContent(document, baseURL)
  const url = exctractPageUrl(document)
  const originId = await genOriginId(url)
  chrome.runtime.sendMessage({
    type: 'PAGE_TO_SAVE',
    content,
    url,
    originId,
  })
}

async function getPageOriginId() {
  const url = exctractPageUrl(document)
  const originId = await genOriginId(url)
  chrome.runtime.sendMessage({
    type: 'PAGE_ORIGIN_ID',
    originId,
  })
}

chrome.runtime.onMessage.addListener((message: MessageTypes) => {
  switch (message.type) {
    case 'REQUEST_PAGE_TO_SAVE':
      readPageContent()
      break
    case 'REQUEST_PAGE_ORIGIN_ID':
      getPageOriginId()
      break
    default:
      break
  }
})
