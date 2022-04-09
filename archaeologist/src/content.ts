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
import { TNode, TNodeJson } from 'smuggler-api'
import { genOriginId } from 'armoury'
import { renderPageAugmentation } from './content/Main'

/**
 * Single socket point in a web page DOM for all Mazed augmentations
 */
const socket = document.createElement('div')
socket.id = 'mazed-archaeologist-content-socket'
document.body.appendChild(socket)

async function readPageContent() {
  const { id: originId, stableUrl } = await genOriginId(
    exctractPageUrl(document)
  )
  const baseURL = `${window.location.protocol}//${window.location.host}`
  const content = isMemorable(stableUrl)
    ? await exctractPageContent(document, baseURL)
    : undefined
  await browser.runtime.sendMessage(
    Message.create({
      type: 'PAGE_TO_SAVE',
      content,
      originId,
      url: stableUrl,
    })
  )
}

async function readSelectedText(text: string): Promise<void> {
  const lang = document.documentElement.lang
  const { id: originId, stableUrl } = await genOriginId(
    exctractPageUrl(document)
  )
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
          originId,
          url: stableUrl,
        })
      )
    }
  }
  document.addEventListener('copy', oncopy, true)
  document.execCommand('copy')
}

const kQuotesForAugmentation: TNode[] = []
async function updateContentAugmentation(
  quotes: TNode[],
  mode: 'append' | 'reset'
): Promise<void> {
  console.log('updateContentAugmentation', socket, quotes)
  if (mode === 'reset') {
    kQuotesForAugmentation.length = 0
  }
  kQuotesForAugmentation.push(...quotes)
  renderPageAugmentation(socket, kQuotesForAugmentation)
}

browser.runtime.onMessage.addListener(async (message: MessageType) => {
  switch (message.type) {
    case 'REQUEST_PAGE_TO_SAVE':
      await readPageContent()
      break
    case 'REQUEST_SELECTED_WEB_QUOTE':
      await readSelectedText(message.text)
      break
    case 'REQUEST_UPDATE_CONTENT_AUGMENTATION':
      {
        const { quotes, mode } = message
        await updateContentAugmentation(
          quotes.map((json: TNodeJson) => TNode.fromJson(json)),
          mode
        )
      }
      break
    default:
      break
  }
})
