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

async function getPageOriginId() {
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

function genElementDomPath(el: Element): string[] {
  const stack = [];
  while (el.parentNode != null) {
    console.log(el.nodeName)
    let sibCountOfType = 0
    let sibIndex = 0
    el.parentNode.childNodes.forEach((sibling: ChildNode, key: number) => {
      console.log('node === node', sibling.nodeName, el.nodeName)
      if (sibling.nodeName === el.nodeName) {
        if (sibling === el) {
          // Children in selector is 1-indexed
          sibIndex = key + 1
        }
        ++sibCountOfType
      }
    })
    if (el.id != '') {
      stack.push(el.nodeName.toLowerCase() + '#' + el.id)
    } else if (sibCountOfType > 1) {
      // https://drafts.csswg.org/selectors/#the-nth-child-pseudo
      stack.push(el.nodeName.toLowerCase() + ':nth-of-type(' + sibCountOfType + ')')
    } else {
      stack.push(el.nodeName.toLowerCase())
    }
    el = el.parentNode as Element
  }
  stack.reverse()
  return stack.slice(1)
}

async function getSelectedText() {
  function oncopy(event: ClipboardEvent) {
      console.log('Oncopy', event)
      document.removeEventListener("copy", oncopy, true)
      event.stopImmediatePropagation()
      event.preventDefault()
      const {target} = event
      if (target) {
        const path = genElementDomPath(target as Element)
        const selected = document.querySelector(path.join(' '))
        console.log('Path', path, selected)
      }
      // TODO(akindyakov): ...
  }
  document.addEventListener("copy", oncopy, true)
  document.execCommand("copy")
}

browser.runtime.onMessage.addListener(async (message: MessageType) => {
  switch (message.type) {
    case 'REQUEST_PAGE_TO_SAVE':
      await readPageContent()
      break
    case 'REQUEST_PAGE_ORIGIN_ID':
      await getPageOriginId()
      break
    case 'REQUEST_SELECTED_QUOTE':
      await getSelectedText()
      break
    default:
      break
  }
})
