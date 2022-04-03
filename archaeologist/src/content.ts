/**
 * Extensions that read or write to web pages utilize a
 * [content script](https://developer.browser.com/docs/extensions/mv3/content_scripts/).
 * The content script contains JavaScript that executes in the contexts of a
 * page that has been loaded into the browser. Content scripts read and modify
 * the DOM of web pages the browser visits.
 */
import browser from 'webextension-polyfill'
import { Message, MessageType } from './message/types'
import {
  exctractPageContent,
  exctractPageUrl,
} from './extractor/webPageContent'

import { isMemorable } from './extractor/unmemorable'

import { genOriginId } from 'armoury'

async function readPageContent() {
  const baseURL = `${window.location.protocol}//${window.location.host}`
  const content = await exctractPageContent(document, baseURL)
  const url = exctractPageUrl(document)
  if (!isMemorable(url)) {
    await browser.runtime.sendMessage(
      Message.create({
        type: 'PAGE_ORIGIN_ID',
        url,
      })
    )
    return
  }
  const { id } = await genOriginId(url)
  await browser.runtime.sendMessage(
    Message.create({
      type: 'PAGE_TO_SAVE',
      content,
      url,
      originId: id,
    })
  )
}

async function getPageOriginId() {
  const url = exctractPageUrl(document)
  let originId = undefined
  if (isMemorable(url)) {
    const { id } = await genOriginId(url)
    originId = id
  }
  await browser.runtime.sendMessage(
    Message.create({
      type: 'PAGE_ORIGIN_ID',
      originId,
      url,
    })
  )
}

browser.runtime.onMessage.addListener(async (message: MessageType) => {
  switch (message.type) {
    case 'REQUEST_PAGE_TO_SAVE':
      await readPageContent()
      break
    case 'REQUEST_PAGE_ORIGIN_ID':
      await getPageOriginId()
      break
    default:
      break
  }
})
