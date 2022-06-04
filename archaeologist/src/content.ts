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
import { log, genOriginId } from 'armoury'
import { renderPageAugmentation } from './content/Main'

log.debug('Mazed content script')
console.log('Mazed content script')

/**
 * Single socket point in a web page DOM for all Mazed augmentations
 */
const socket = document.createElement('div')
socket.id = 'mazed-archaeologist-content-socket'
document.body.appendChild(socket)

/**
 * Augmentation here is a set of elements added to a web page by archaeologist.
 *
 * - `quotes` - highlightings in web page.
 * - `bookmark` - saved web page as a web bookmark.
 *
 * Today we use statefull approach, where we keep current state in `content.ts`
 * script and update or reset it as needed using `mode` before re-rendering all
 * augmentations.
 */
const augmentation: {
  quotes: TNode[]
  bookmark: TNode | null
} = {
  quotes: [],
  bookmark: null,
}

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
      quoteNids: augmentation.quotes.map((node) => node.nid),
    })
  )
}

async function readSelectedText(text: string): Promise<void> {
  console.log('Mazed augmentation', augmentation)
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
          fromNid: augmentation.bookmark?.nid,
        })
      )
    }
  }
  document.addEventListener('copy', oncopy, true)
  document.execCommand('copy')
}

async function updateContentAugmentation(
  quotes: TNode[],
  bookmark: TNode | null,
  mode: 'append' | 'reset'
): Promise<void> {
  if (mode === 'reset') {
    augmentation.quotes.length = 0
    augmentation.bookmark = null
  }
  if (bookmark != null) {
    // If mode is not 'reset', null bookmark in arguments should not discard
    // existing bookmark
    augmentation.bookmark = bookmark
  }
  augmentation.quotes.push(...quotes)
  renderPageAugmentation(socket, augmentation.quotes)
}

browser.runtime.onMessage.addListener(async (message: MessageType) => {
  log.debug('Content message listener', message)
  switch (message.type) {
    case 'REQUEST_PAGE_TO_SAVE':
      await readPageContent()
      break
    case 'REQUEST_SELECTED_WEB_QUOTE':
      await readSelectedText(message.text)
      break
    case 'REQUEST_UPDATE_CONTENT_AUGMENTATION':
      {
        const { quotes, bookmark, mode } = message
        await updateContentAugmentation(
          quotes.map((json: TNodeJson) => TNode.fromJson(json)),
          bookmark != null ? TNode.fromJson(bookmark) : null,
          mode
        )
      }
      break
    default:
      break
  }
})
