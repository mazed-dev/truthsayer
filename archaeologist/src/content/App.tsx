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
import { AppErrorBoundary } from './AppErrorBoundary'

async function contentOfThisDocument(origin: OriginIdentity) {
  const baseURL = `${window.location.protocol}//${window.location.host}`
  const content = isMemorable(origin.stableUrl)
    ? await exctractPageContent(document, baseURL)
    : undefined
  return content
}

async function getCurrentlySelectedPath() {
  // TODO(akindyakov): Use window.getSelection() to obtain `anchorNode` instead
  // of this hacky approach with "copy" event. This way we can get a better
  // precision of selection and stabilise `target` extraction in general.
  // The approach with "copy" might fail due to browser security checks, because
  // we use `clipboardWrite` permission without claiming it in `manifest.json`.
  //
  // https://github.com/Thread-knowledge/truthsayer/issues/216
  //
  // console.log('Selection', window.getSelection())
  return await new Promise<string[]>((resolve, reject) => {
    function oncopy(event: ClipboardEvent) {
      document.removeEventListener('copy', oncopy, true)
      event.stopImmediatePropagation()
      event.preventDefault()
      const { target } = event
      if (target) {
        resolve(genElementDomPath(target as Element))
      }
      reject(
        'Failed to determine currently selected path through a "copy" event'
      )
    }

    document.addEventListener('copy', oncopy, true)
    document.execCommand('copy')
  })
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
    async (message: ToContent.Request): Promise<FromContent.Response> => {
      switch (message.type) {
        case 'REQUEST_PAGE_CONTENT':
          if (bookmark == null) {
            // Bookmark if not yet bookmarked
            const content = await contentOfThisDocument(originIdentity)
            log.debug('Page content requested', content)
            return {
              type: 'PAGE_TO_SAVE',
              content,
              url: originIdentity.stableUrl,
              originId: originIdentity.id,
              quoteNids: quotes.map((node) => node.nid),
            }
          }
          break
        case 'REQUEST_SELECTED_WEB_QUOTE': {
          const lang = document.documentElement.lang
          return {
            type: 'SELECTED_WEB_QUOTE',
            text: message.text,
            path: await getCurrentlySelectedPath(),
            lang,
            originId: originIdentity.id,
            url: originIdentity.stableUrl,
            fromNid: bookmark?.nid,
          }
        }
        case 'REQUEST_UPDATE_CONTENT_AUGMENTATION': {
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
          return { type: 'VOID_RESPONSE' }
        }
        case 'SHOW_DISAPPEARING_NOTIFICATION': {
          const { text, href, tooltip, timeoutMsec } = message
          setNotification({
            text,
            tooltip,
            href,
            timeoutMsec,
          })
          return { type: 'VOID_RESPONSE' }
        }
      }
      throw new Error(
        `Unknown ToContent.Message type, message = ${JSON.stringify(message)}`
      )
    },
    [bookmark, quotes, originIdentity]
  )
  useEffect(() => {
    browser.runtime.onMessage.addListener(listener)
    return () => browser.runtime.onMessage.removeListener(listener)
  }, [listener])
  return (
    <AppErrorBoundary>
      <Toaster />
      {notification ? (
        <DisappearingToast {...notification}></DisappearingToast>
      ) : null}
      <Quotes quotes={quotes} />
      <ActivityTracker
        registerAttentionTime={(
          deltaSeconds: number,
          totalSecondsEstimation: number
        ) =>
          FromContent.sendMessage({
            type: 'ATTENTION_TIME_CHUNK',
            deltaSeconds,
            totalSecondsEstimation,
            origin: originIdentity,
          })
        }
        disabled={bookmark != null}
      />
    </AppErrorBoundary>
  )
}

export function renderPageAugmentationApp(mount: HTMLDivElement) {
  ReactDOM.render(<App />, mount)
}
