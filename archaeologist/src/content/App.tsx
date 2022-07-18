import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'

import browser from 'webextension-polyfill'

import { TNode, TNodeJson } from 'smuggler-api'
import { genOriginId, OriginIdentity, log } from 'armoury'

import { FromContent, ToContent } from './../message/types'
import { genElementDomPath } from './extractor/html'
import { isMemorable } from './extractor/unmemorable'
import {
  exctractPageContent,
  exctractPageUrl,
} from './extractor/webPageContent'

import { Quotes } from './quote/Quotes'
import { ActivityTracker } from './activity-tracker/ActivityTracker'
import {
  Toaster,
  DisappearingToast,
  DisappearingToastProps,
} from './toaster/Toaster'

async function bookmarkPage(quotes: TNode[], origin: OriginIdentity) {
  const baseURL = `${window.location.protocol}//${window.location.host}`
  const content = isMemorable(origin.stableUrl)
    ? await exctractPageContent(document, baseURL)
    : undefined
  await FromContent.sendMessage({
    type: 'PAGE_TO_SAVE',
    content,
    originId: origin.id,
    url: origin.stableUrl,
    quoteNids: quotes.map((node) => node.nid),
  })
}

async function saveSelectedTextAsQuote(
  text: string,
  bookmark: TNode | null,
  origin: OriginIdentity
): Promise<void> {
  const lang = document.documentElement.lang
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
      FromContent.sendMessage({
        type: 'SELECTED_WEB_QUOTE',
        text,
        path,
        lang,
        originId: origin.id,
        url: origin.stableUrl,
        fromNid: bookmark?.nid,
      })
    }
  }
  document.addEventListener('copy', oncopy, true)
  document.execCommand('copy')
}

const App = () => {
  const [quotes, setQuotes] = useState<TNode[]>([])
  const [bookmark, setBookmark] = useState<TNode | null>(null)
  const originIdentity = React.useMemo(() => {
    const originIdentity = genOriginId(exctractPageUrl(document))
    log.debug('Gen origin identity', originIdentity)
    return originIdentity
  }, [])
  const [notification, setNotification] =
    useState<DisappearingToastProps | null>(null)
  const listener = React.useCallback(
    async (message: ToContent.Message) => {
      switch (message.type) {
        case 'REQUEST_PAGE_CONTENT':
          if (bookmark == null) {
            // Bookmark if not yet bookmarked
            await bookmarkPage(quotes, originIdentity)
          }
          break
        case 'REQUEST_SELECTED_WEB_QUOTE':
          await saveSelectedTextAsQuote(message.text, bookmark, originIdentity)
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
        case 'SHOW_DISAPPEARING_NOTIFICATION':
          {
            const { text, href, tooltip, timeoutMsec } = message
            setNotification({
              text,
              tooltip,
              href,
              timeoutMsec,
            })
          }
          break
        default:
          break
      }
    },
    [bookmark, quotes, originIdentity]
  )
  useEffect(() => {
    browser.runtime.onMessage.addListener(listener)
    return () => browser.runtime.onMessage.removeListener(listener)
  }, [listener])
  return (
    <>
      <Toaster />
      {notification ? (
        <DisappearingToast {...notification}></DisappearingToast>
      ) : null}
      <Quotes quotes={quotes} />
      <ActivityTracker
        registerAttentionTime={(
          deltaSeconds: number,
          totalSeconds: number,
          totalSecondsEstimation: number
        ) =>
          FromContent.sendMessage({
            type: 'ATTENTION_TIME_CHUNK',
            deltaSeconds,
            totalSeconds,
            totalSecondsEstimation,
            origin: originIdentity,
          })
        }
        disabled={bookmark != null}
      />
    </>
  )
}

export function renderPageAugmentationApp(mount: HTMLDivElement) {
  ReactDOM.render(<App />, mount)
}
