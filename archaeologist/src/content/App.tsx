import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'

import browser from 'webextension-polyfill'

import { TNode, TNodeJson } from 'smuggler-api'
import { genOriginId } from 'armoury'

import { Message, MessageType } from './../message/types'
import { genElementDomPath } from './../extractor/html'
import { isMemorable } from './../extractor/unmemorable'
import {
  exctractPageContent,
  exctractPageUrl,
} from './../extractor/webPageContent'

import { Quotes } from './quote/Quotes'
import { ReadingDetector } from './reading/ReadingDetector'

async function readPageContent(quotes: TNode[]) {
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
      quoteNids: quotes.map((node) => node.nid),
    })
  )
}

async function readSelectedText(
  text: string,
  bookmark: TNode | null
): Promise<void> {
  const lang = document.documentElement.lang
  const { id: originId, stableUrl } = await genOriginId(
    exctractPageUrl(document)
  )
  // TODO(akindyakov): Use window.getSelection() to obtain `anchorNode` instead
  // of this hacky approach with "copy" event. This way we can get a better
  // precision of selection and stabilise `target` extraction in general.
  // The approach with "copy" might fail due to browser security checks, because
  // we use `clipboardWrite` permission without claiming it in `manifest.json`.
  //
  // https://github.com/Thread-knowledge/truthsayer/issues/216
  //
  // console.log('Selection', window.getSelection())
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
          fromNid: bookmark?.nid,
        })
      )
    }
  }
  document.addEventListener('copy', oncopy, true)
  document.execCommand('copy')
}

const App = () => {
  const [quotes, setQuotes] = useState<TNode[]>([])
  const [bookmark, setBookmark] = useState<TNode | null>(null)
  const listener = async (message: MessageType) => {
    switch (message.type) {
      case 'REQUEST_PAGE_TO_SAVE':
        await readPageContent(quotes)
        break
      case 'REQUEST_SELECTED_WEB_QUOTE':
        await readSelectedText(message.text, bookmark)
        break
      case 'REQUEST_UPDATE_CONTENT_AUGMENTATION':
        {
          const { quotes, bookmark, mode } = message
          const qs = quotes.map((json: TNodeJson) => TNode.fromJson(json))
          const bm = bookmark != null ? TNode.fromJson(bookmark) : null
          if (mode === 'reset') {
            setQuotes(qs)
            setBookmark(bm)
          } else {
            if (bm != null) {
              // If mode is not 'reset', null bookmark in arguments should not discard
              // existing bookmark
              setBookmark(bm)
            }
            setQuotes((current) => current.concat(...qs))
          }
        }
        break
      default:
        break
    }
  }
  useEffect(() => {
    browser.runtime.onMessage.addListener(listener)
    return () => {
      browser.runtime.onMessage.removeListener(listener)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return <><Quotes quotes={quotes} /><ReadingDetector /></>
}

export function renderPageAugmentationApp(mount: HTMLDivElement) {
  ReactDOM.render(<App />, mount)
}
