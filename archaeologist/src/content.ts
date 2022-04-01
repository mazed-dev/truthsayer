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
import { genElementDomPath } from './extractor/html'
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
  const originId = await genOriginId(url)
  await browser.runtime.sendMessage(
    Message.create({
      type: 'PAGE_TO_SAVE',
      content,
      url,
      originId,
    })
  )
}

async function readPageOriginId() {
  const url = exctractPageUrl(document)
  let originId = undefined
  if (isMemorable(url)) {
    originId = await genOriginId(url)
  }
  await browser.runtime.sendMessage(
    Message.create({
      type: 'PAGE_ORIGIN_ID',
      originId,
      url,
    })
  )
}

const root = document.createElement('div')
root.id = 'mazed-archaeologist-content-root'
document.body.appendChild(root)

async function readSelectedText(text: string): Promise<void> {
  const lang = document.documentElement.lang
  const url = exctractPageUrl(document)
  const originId = await genOriginId(url)
  function oncopy(event: ClipboardEvent) {
    document.removeEventListener('copy', oncopy, true)
    event.stopImmediatePropagation()
    event.preventDefault()
    const { target } = event
    if (target) {
      const path = genElementDomPath(target as Element)
      browser.runtime.sendMessage(
        Message.create({
          type: 'SELECTED_WEB_QUOTE',
          text,
          path,
          lang,
          url,
          originId,
        })
      )
    }
  }
  document.addEventListener('copy', oncopy, true)
  document.execCommand('copy')
}

browser.runtime.onMessage.addListener(async (message: MessageType) => {
  switch (message.type) {
    case 'REQUEST_PAGE_TO_SAVE':
      await readPageContent()
      break
    case 'REQUEST_PAGE_ORIGIN_ID':
      await readPageOriginId()
      break
    case 'REQUEST_SELECTED_WEB_QUOTE':
      await readSelectedText(message.text)
      break
    default:
      break
  }
})
