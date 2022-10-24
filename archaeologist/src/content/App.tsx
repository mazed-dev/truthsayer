import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'

import browser from 'webextension-polyfill'

import { TNode, TNodeJson } from 'smuggler-api'
import { genOriginId, OriginIdentity, log } from 'armoury'
import { truthsayer_archaeologist_communication } from 'elementary'

import {
  FromContent,
  ToContent,
  ContentAppOperationMode,
  BrowserHistoryUploadProgress,
} from './../message/types'
import { genElementDomPath } from './extractor/html'
import { isMemorable } from './extractor/url/unmemorable'
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
import { isPageAutosaveable } from './extractor/url/autosaveable'
import { BrowserHistoryImportControlPortal } from './BrowserHistoryImportControl'

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

/**
 * State in which @see App starts when content script gets loaded by the browser.
 * Can be switched to @see InitializedState via an explicit request.
 *
 * When a web page gets loaded first, non-content parts of the browser extension
 * may need to supply an equivalent of constructor parameters to content script.
 * There are no native mechanisms to do so, so it is simulated by separating
 * @see UninitializedState from every other possible state.
 */
type UninitializedState = {
  mode: 'uninitialised-content-app'
}

/**
 * State on an @see App that has been explicitely initialized.
 * @see UninitializedState for more info.
 */
type InitializedState = {
  mode: ContentAppOperationMode

  originIdentity: OriginIdentity
  quotes: TNode[]
  bookmark?: TNode
  notification?: DisappearingToastProps
  browserHistoryUploadProgress: BrowserHistoryUploadProgress
}

type State = UninitializedState | InitializedState

type Action =
  | { type: 'init-app'; data: ToContent.InitContentAugmentationRequest }
  | { type: 'update-nodes'; data: ToContent.UpdateContentAugmentationRequest }
  | {
      type: 'show-notification'
      data: ToContent.ShowDisappearingNotificationRequest
    }
  | {
      type: 'update-browser-history-upload-progress'
      data: ToContent.ReportBrowserHistoryUploadProgress
    }

function updateState(state: State, action: Action): State {
  switch (action.type) {
    case 'init-app': {
      const originIdentity = genOriginId(exctractPageUrl(document))
      if (
        state.mode !== 'uninitialised-content-app' &&
        state.originIdentity.stableUrl === originIdentity.stableUrl
      ) {
        // NOTE (snikitin@): This case is not handled as an error intentionaly.
        // At the time of this writing this action is kicked off when a browser
        // emits browser.tabs.onUpdated event.
        // See https://stackoverflow.com/a/18302254/3375765 for info on why
        // duplicate calls are difficult to prevent.
        //
        // UPDATE-1 (akindyakov@): Browser emits browser.tabs.onUpdated event on
        // any Tab props change that happens without tab full reload, for instance
        // page location change intiated from JS by react-dom. In such cases
        // 'init-app' has to be treated as state reset.
        console.warn(
          'Attempted to init content app more than once, ignoring all calls except first'
        )
        return state
      }
      const { mode, quotes, bookmark } = action.data
      return {
        mode,
        originIdentity: genOriginId(exctractPageUrl(document)),
        quotes: quotes.map((json: TNodeJson) => TNode.fromJson(json)),
        bookmark: bookmark != null ? TNode.fromJson(bookmark) : undefined,
        browserHistoryUploadProgress: { processed: 0, total: 0 },
      }
    }
    case 'update-nodes':
      if (state.mode === 'uninitialised-content-app') {
        throw new Error("Can't modify state of an unitialized content app")
      }
      const d = action.data
      const newQuotes = d.quotes.map((json: TNodeJson) => TNode.fromJson(json))
      const newBookmark =
        d.bookmark != null ? TNode.fromJson(d.bookmark) : undefined

      return {
        ...state,
        quotes: d.mode === 'reset' ? newQuotes : state.quotes.concat(newQuotes),
        bookmark:
          d.mode === 'reset' ? newBookmark : state.bookmark || newBookmark,
      }
    case 'show-notification':
      if (state.mode === 'uninitialised-content-app') {
        throw new Error("Can't modify state of an unitialized content app")
      }

      const { text, href, tooltip, timeoutMsec } = action.data
      return {
        ...state,
        notification: {
          text,
          tooltip,
          href,
          timeoutMsec,
        },
      }
    case 'update-browser-history-upload-progress':
      if (state.mode === 'uninitialised-content-app') {
        throw new Error("Can't modify state of an unitialized content app")
      }

      return {
        ...state,
        browserHistoryUploadProgress: action.data.newState,
      }
  }
}

async function handleReadOnlyRequest(
  state: InitializedState,
  request: ToContent.ReadOnlyRequest
): Promise<FromContent.Response> {
  switch (request.type) {
    case 'REQUEST_PAGE_CONTENT':
      if (state.bookmark == null) {
        if (
          !request.manualAction &&
          !isPageAutosaveable(document.URL, document)
        ) {
          return { type: 'PAGE_NOT_WORTH_SAVING' }
        }
        // Bookmark if not yet bookmarked
        const content = await contentOfThisDocument(state.originIdentity)
        log.debug('Page content requested', content)
        return {
          type: 'PAGE_TO_SAVE',
          content,
          url: state.originIdentity.stableUrl,
          originId: state.originIdentity.id,
          quoteNids: state.quotes.map((node) => node.nid),
        }
      }
      return { type: 'PAGE_ALREADY_SAVED' }
    case 'REQUEST_SELECTED_WEB_QUOTE': {
      const lang = document.documentElement.lang
      return {
        type: 'SELECTED_WEB_QUOTE',
        text: request.text,
        path: await getCurrentlySelectedPath(),
        lang,
        originId: state.originIdentity.id,
        url: state.originIdentity.stableUrl,
        fromNid: state.bookmark?.nid,
      }
    }
  }
}

function mutatingRequestToAction(request: ToContent.MutatingRequest): Action {
  switch (request.type) {
    case 'INIT_CONTENT_AUGMENTATION_REQUEST': {
      return { type: 'init-app', data: request }
    }
    case 'REQUEST_UPDATE_CONTENT_AUGMENTATION': {
      return { type: 'update-nodes', data: request }
    }
    case 'SHOW_DISAPPEARING_NOTIFICATION': {
      return { type: 'show-notification', data: request }
    }
    case 'REPORT_BROWSER_HISTORY_UPLOAD_PROGRESS': {
      return { type: 'update-browser-history-upload-progress', data: request }
    }
  }
}

const App = () => {
  const initialState: UninitializedState = {
    mode: 'uninitialised-content-app',
  }
  const [state, dispatch] = React.useReducer(updateState, initialState)

  const listener = React.useCallback(
    async (message: ToContent.Request): Promise<FromContent.Response> => {
      switch (message.type) {
        case 'REQUEST_PAGE_CONTENT':
        case 'REQUEST_SELECTED_WEB_QUOTE': {
          if (state.mode === 'uninitialised-content-app') {
            throw new Error(
              "Can't perform read requests on uninitalized content app"
            )
          }
          return handleReadOnlyRequest(state, message)
        }
        case 'INIT_CONTENT_AUGMENTATION_REQUEST':
        case 'REQUEST_UPDATE_CONTENT_AUGMENTATION':
        case 'SHOW_DISAPPEARING_NOTIFICATION':
        case 'REPORT_BROWSER_HISTORY_UPLOAD_PROGRESS': {
          dispatch(mutatingRequestToAction(message))
          return { type: 'VOID_RESPONSE' }
        }
      }
    },
    [state]
  )
  useEffect(() => {
    browser.runtime.onMessage.addListener(listener)
    return () => browser.runtime.onMessage.removeListener(listener)
  }, [listener])

  if (state.mode === 'uninitialised-content-app') {
    return null
  }

  const activityTrackerOrNull =
    state.mode === 'active-mode-content-app' ? (
      <ActivityTracker
        registerAttentionTime={(
          deltaSeconds: number,
          totalSecondsEstimation: number
        ) =>
          FromContent.sendMessage({
            type: 'ATTENTION_TIME_CHUNK',
            deltaSeconds,
            totalSecondsEstimation,
            origin: state.originIdentity,
          })
        }
        disabled={state.bookmark != null}
      />
    ) : null
  return (
    <AppErrorBoundary>
      <truthsayer_archaeologist_communication.ArchaeologistVersion
        version={{
          version: browser.runtime.getManifest().version,
        }}
      />
      <Toaster />
      {state.notification ? (
        <DisappearingToast {...state.notification}></DisappearingToast>
      ) : null}
      <Quotes quotes={state.quotes} />
      {activityTrackerOrNull}
      <BrowserHistoryImportControlPortal
        progress={state.browserHistoryUploadProgress}
        modes={['resumable', 'untracked']}
      />
    </AppErrorBoundary>
  )
}

export function renderPageAugmentationApp(mount: HTMLDivElement) {
  ReactDOM.render(<App />, mount)
  log.debug('Page content augmentation is loaded')
}
