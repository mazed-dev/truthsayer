import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'

import browser from 'webextension-polyfill'
import { PostHog } from 'posthog-js'
import { v4 as uuidv4 } from 'uuid'

import { NodeUtil, NodeType, makeMsgProxyStorageApi } from 'smuggler-api'
import type {
  TNode,
  TNodeJson,
  ForwardToRealImpl,
  StorageApiMsgPayload,
  StorageApiMsgReturnValue,
  Nid,
} from 'smuggler-api'
import {
  genOriginId,
  OriginIdentity,
  log,
  productanalytics,
  ErrorViaMessage,
} from 'armoury'

import { truthsayer } from 'elementary'

import {
  FromContent,
  ToContent,
  ContentAppOperationMode,
} from './../message/types'
import { genElementDomPath } from './extractor/html'
import { isMemorable } from './extractor/url/unmemorable'
import {
  exctractPageContent,
  exctractPageUrl,
  fetchAnyPagePreviewImage,
} from './extractor/webPageContent'
import { extractSimilaritySearchPhraseFromPageContent } from './extractor/webPageSearchPhrase'

import { Quotes } from './quote/Quotes'
import { ActivityTracker } from './activity-tracker/ActivityTracker'
import {
  Toaster,
  DisappearingToast,
  DisappearingToastProps,
} from './toaster/Toaster'
import { AppErrorBoundary } from './AppErrorBoundary'
import { isPageAutosaveable } from './extractor/url/autosaveable'
import { SuggestedRelatives } from './augmentation/SuggestedRelatives'
import { AugmentationMountPoint } from './augmentation/Mount'
import { ContentContext } from './context'
import { FromArchaeologistContent } from 'truthsayer-archaeologist-communication'

async function contentOfThisDocument(origin: OriginIdentity) {
  const baseURL = `${window.location.protocol}//${window.location.host}`
  const content = isMemorable(origin.stableUrl)
    ? exctractPageContent(document, baseURL)
    : undefined
  if (content) {
    const image = await fetchAnyPagePreviewImage(
      document,
      content.previewImageUrls
    )
    return { ...content, image }
  }
  return undefined
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
  bookmark?: TNode

  toNodes: TNode[]
  fromNodes: TNode[]
  notification?: DisappearingToastProps

  analytics: PostHog | null

  tabStatus: {
    // A counter that get bumped each time when the tab is re-activated, which
    // means user returned to the tab from another one. It's used now to trigger
    // new similarity search for suggestions on every change of this number.
    activationCounter: number
  }
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
      type: 'notify-tab-status-update'
      data: ToContent.RequestTabStatusUpdate
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

      const {
        mode,
        nodeEnv,
        bookmark: bookmarkJson,
        toNodes: toNodesJson,
        fromNodes: fromNodesJson,
      } = action.data
      const bookmark =
        bookmarkJson != null ? NodeUtil.fromJson(bookmarkJson) : undefined
      const toNodes = toNodesJson.map((json: TNodeJson) =>
        NodeUtil.fromJson(json)
      )
      const fromNodes = fromNodesJson.map((json: TNodeJson) =>
        NodeUtil.fromJson(json)
      )

      let analytics: PostHog | null = null
      if (mode.type !== 'passive-mode-content-app') {
        analytics = productanalytics.make('archaeologist/content', nodeEnv, {
          // Opening every web page that gets augmented with a content scripts
          // gets counted as a '$pageview' event, doesn't matter if a user actually
          // interacted with the augmentation or not. This produces noisy data,
          // so pageviews are explicitely disabled.
          capture_pageview: false,
          autocapture: false,
          // Block as many properties as possible that could leak user's
          // browsing history to PostHog
          property_blacklist: [
            '$current_url',
            '$host',
            '$referrer',
            '$pathname',
            '$referring_domain',
            '$initial_pathname',
            '$initial_referring_domain',
          ],
          save_referrer: false,
          bootstrap: {
            // NOTE: in content script analytics it is important to identify
            // a user at the moment of analytics instance creation, not via deferred
            // call to identify() because identify() generates a separate "$identify"
            // event to PostHog. Every web page user opens then produces such
            // an event which (as believed at the time of this writing) produces
            // no value and just makes the data in PostHog difficult to navigate.
            distinctID: mode.analyticsIdentity.analyticsIdentity,
            isIdentifiedID: true,
          },
          // Unlike product analytics tracked for truthsayer, persist data
          // about a single augmented web page in memory of the page itself.
          // This means that different "instances" of product analytics
          // won't interfere with each other accidentally, which is of
          // particular importance for analytics properties like 'augmenter-url-guid'
          persistence: 'memory',
        })
        if (analytics != null) {
          analytics.register({
            // At the time of this writing the URL of a web-page where
            // content script has been loaded is intentionally not reported
            // for privacy reasons. However it is anticipated that it'll be
            // useful to be able to link together user's interactions with
            // Mazed within that single specific web-page, so an anonymous
            // GUID is published instead.
            augmented_url_guid: uuidv4(),
          })
        }
      }

      return {
        mode,
        originIdentity,
        bookmark,
        toNodes,
        fromNodes,
        analytics,
        tabStatus: {
          activationCounter: 0,
        },
      }
    }
    case 'update-nodes':
      if (state.mode === 'uninitialised-content-app') {
        throw new Error("Can't modify state of an unitialized content app")
      }
      const d = action.data
      const newToNodes = d.toNodes.map((json: TNodeJson) =>
        NodeUtil.fromJson(json)
      )
      const newFromNodes = d.fromNodes.map((json: TNodeJson) =>
        NodeUtil.fromJson(json)
      )
      const newBookmark =
        d.bookmark != null ? NodeUtil.fromJson(d.bookmark) : undefined

      return {
        ...state,
        fromNodes:
          d.mode === 'reset'
            ? newFromNodes
            : state.fromNodes.concat(newFromNodes),
        toNodes:
          d.mode === 'reset' ? newToNodes : state.toNodes.concat(newToNodes),
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
    case 'notify-tab-status-update':
      if (state.mode === 'uninitialised-content-app') {
        throw new Error("Can't update tab state of an unitialized content app")
      }
      const { activated } = action.data.change
      return {
        ...state,
        tabStatus: {
          activationCounter:
            state.tabStatus.activationCounter + (!!activated ? 1 : 0),
        },
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
        const quotes = state.toNodes.filter(
          (node) => node.ntype === NodeType.WebQuote
        )
        return {
          type: 'PAGE_TO_SAVE',
          content,
          url: state.originIdentity.stableUrl,
          originId: state.originIdentity.id,
          quoteNids: quotes.map((node) => node.nid),
        }
      }
      return {
        type: 'PAGE_ALREADY_SAVED',
        bookmark: NodeUtil.toJson(state.bookmark),
        toNodes: state.toNodes.map((n) => NodeUtil.toJson(n)),
        fromNodes: state.fromNodes.map((n) => NodeUtil.toJson(n)),
      }
    case 'REQUEST_SELECTED_WEB_QUOTE': {
      const lang = document.documentElement.lang
      return {
        type: 'SELECTED_WEB_QUOTE',
        text: request.text,
        path: await getCurrentlySelectedPath(),
        lang,
        url: state.originIdentity.stableUrl,
        fromNid: state.bookmark?.nid,
      }
    }
    case 'REQUEST_PAGE_CONTENT_SEARCH_PHRASE': {
      const baseURL = `${window.location.protocol}//${window.location.host}`
      const nidsExcludedFromSearch = genExcludeNidsForSimilaritySearch(
        state.toNodes,
        state.bookmark
      )
      const phrase =
        extractSimilaritySearchPhraseFromPageContent(document, baseURL) ??
        undefined
      return {
        type: 'PAGE_CONTENT_SEARCH_PHRASE_RESPONSE',
        nidsExcludedFromSearch,
        phrase,
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
    case 'REQUEST_UPDATE_TAB_STATUS': {
      return { type: 'notify-tab-status-update', data: request }
    }
  }
}

function genExcludeNidsForSimilaritySearch(
  toNodes: TNode[],
  bookmark?: TNode
): Nid[] {
  return (
    toNodes
      // Don't show the page itself and it's quotes among suggested
      .filter((node) => node.ntype === NodeType.WebQuote)
      .map((node) => node.nid)
      .concat(bookmark != null ? [bookmark.nid] : [])
  )
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
        case 'REQUEST_SELECTED_WEB_QUOTE':
        case 'REQUEST_PAGE_CONTENT_SEARCH_PHRASE': {
          if (state.mode === 'uninitialised-content-app') {
            throw new Error(
              "Can't perform read requests on uninitalized content app"
            )
          }
          return handleReadOnlyRequest(state, message)
        }
        case 'INIT_CONTENT_AUGMENTATION_REQUEST':
        case 'REQUEST_UPDATE_CONTENT_AUGMENTATION':
        case 'REQUEST_UPDATE_TAB_STATUS':
        case 'SHOW_DISAPPEARING_NOTIFICATION': {
          dispatch(mutatingRequestToAction(message))
          return { type: 'VOID_RESPONSE' }
        }
        case 'REPORT_BACKGROUND_OPERATION_PROGRESS': {
          FromArchaeologistContent.sendMessage(message)
          return { type: 'VOID_RESPONSE' }
        }
      }
    },
    [state]
  )
  useEffect(() => {
    const rethrown = ErrorViaMessage.rethrow(listener)
    browser.runtime.onMessage.addListener(rethrown)
    return () => browser.runtime.onMessage.removeListener(rethrown)
  }, [listener])
  if (state.mode === 'uninitialised-content-app') {
    return null
  }

  const activityTrackerOrNull =
    state.mode.type === 'active-mode-content-app' ? (
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
  const forwardToBackground: ForwardToRealImpl = async (
    payload: StorageApiMsgPayload
  ): Promise<StorageApiMsgReturnValue> => {
    const response = await FromContent.sendMessage({
      type: 'MSG_PROXY_STORAGE_ACCESS_REQUEST',
      payload,
    })
    return response.value
  }
  return (
    <AppErrorBoundary>
      <ContentContext.Provider
        value={{
          analytics: state.analytics ?? undefined,
          storage: makeMsgProxyStorageApi(forwardToBackground),
        }}
      >
        {truthsayer.url.belongs(document.URL) ? null : (
          <>
            <Toaster />
            <AugmentationMountPoint />
            {state.notification ? (
              <DisappearingToast {...state.notification} />
            ) : null}
            <Quotes
              quotes={state.toNodes.filter(
                (node) => node.ntype === NodeType.WebQuote
              )}
            />
            {activityTrackerOrNull}
            <SuggestedRelatives
              stableUrl={state.originIdentity.stableUrl}
              excludeNids={genExcludeNidsForSimilaritySearch(
                state.toNodes,
                state.bookmark
              )}
              tabActivationCounter={state.tabStatus.activationCounter}
            />
          </>
        )}
      </ContentContext.Provider>
    </AppErrorBoundary>
  )
}

export function renderPageAugmentationApp(mount: HTMLDivElement) {
  ReactDOM.render(<App />, mount)
  log.debug('Page content augmentation is loaded')
}
