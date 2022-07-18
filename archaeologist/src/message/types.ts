import { WebPageContent } from './../content/extractor/webPageContent'
import { OriginHash, TNodeJson, OriginIdentity } from 'smuggler-api'
import browser from 'webextension-polyfill'

/**
 * There are 3 kind of message senders/receivers:
 *   - popup
 *   - content (all browser tabs)
 *   - background
 *
 * First 2 can talk only to background and not to each other, so there are 2
 * communication channels and 4 groups of messages:
 *   - `ToPopUp` - from background to popup
 *   - `FromPopUp` - from popup to background
 *   - `ToContent` - from background to content (any of the tabs)
 *   - `FromContent` - from content (any tab) to background
 *
 *   ┌───────┐       ┌────────────┐       ┌─────────┐
 *   │ popup │  ──▷  │ background │  ──▷  │ content │─┐
 *   └───────┘  ◁──  └────────────┘  ◁──  └───(#1)──┘ │─┐
 *                                          └───(#2)──┘ │
 *                                            └───(#3)──┘
 */

export namespace FromPopUp {
  export interface AuthStatusRequest {
    type: 'REQUEST_AUTH_STATUS'
  }

  export interface PageInActiveTabStatusRequest {
    type: 'REQUEST_PAGE_IN_ACTIVE_TAB_STATUS'
  }
  /**
   * Save page command chain
   * [ User -> popup -> REQUEST_PAGE_TO_SAVE -> background
   *   -> REQUEST_PAGE_CONTENT -> content -> PAGE_TO_SAVE -> background ]
   */
  export interface SavePageRequest {
    type: 'REQUEST_PAGE_TO_SAVE'
  }
  export type Message =
    | SavePageRequest
    | PageInActiveTabStatusRequest
    | AuthStatusRequest

  export function sendMessage(message: Message): Promise<void> {
    const msg: ToBackground.Message = { direction: 'from-popup', ...message }
    return browser.runtime.sendMessage(msg)
  }
}
export namespace ToPopUp {
  export interface AuthStatusResponse {
    type: 'AUTH_STATUS'
    status: boolean
  }
  export interface UpdatePopUpCards {
    type: 'UPDATE_POPUP_CARDS'
    bookmark?: TNodeJson
    quotes: TNodeJson[]
    unmemorable?: boolean

    // 'reset':
    //    - for quotes and bookmark, reset (replace) existing ones in PopUp window
    // 'append':
    //    - for quotes append quotes to existing ones in PopUp window
    //    - for bookmark, replace existing one in PopUp window, if specified
    mode: 'reset' | 'append'
  }

  export type Message = UpdatePopUpCards | AuthStatusResponse
  export function sendMessage(message: Message): Promise<void> {
    return browser.runtime.sendMessage(message)
  }
}

export namespace ToContent {
  export interface RequestPageContent {
    type: 'REQUEST_PAGE_CONTENT'
  }
  export interface UpdateContentAugmentationRequest {
    type: 'REQUEST_UPDATE_CONTENT_AUGMENTATION'
    quotes: TNodeJson[]
    bookmark?: TNodeJson
    mode: 'reset' | 'append'
  }
  export interface GetSelectedQuoteRequest {
    type: 'REQUEST_SELECTED_WEB_QUOTE'
    text: string
  }
  export interface ShowDisappearingNotification {
    type: 'SHOW_DISAPPEARING_NOTIFICATION'
    text: string
    href?: string
    tooltip?: string
    timeoutMsec?: number
  }
  export type Message =
    | RequestPageContent
    | UpdateContentAugmentationRequest
    | GetSelectedQuoteRequest
    | ShowDisappearingNotification
  export function sendMessage(tabId: number, message: Message): Promise<void> {
    return browser.tabs.sendMessage(tabId, message)
  }
}
export namespace FromContent {
  export interface SavePageResponse {
    type: 'PAGE_TO_SAVE'
    url: string
    originId: OriginHash
    // Missing content is for a page that can not be saved
    content?: WebPageContent
    // Saving page quotes to connect as right hand side cards
    quoteNids: string[]
  }
  export interface GetSelectedQuoteResponse {
    type: 'SELECTED_WEB_QUOTE'
    text: string
    path: string[]
    url: string
    originId: OriginHash
    lang?: string
    // If specified, the requested web quote is connected to the bookmark on the
    // right hand side
    fromNid?: string
  }
  /** Describes for how long a user actively paid attention to a particular webpage */
  export interface AttentionTimeChunk {
    type: 'ATTENTION_TIME_CHUNK'
    deltaSeconds: number
    totalSeconds: number
    totalSecondsEstimation: number
    origin: OriginIdentity
  }
  export type Message =
    | GetSelectedQuoteResponse
    | SavePageResponse
    | AttentionTimeChunk
  export function sendMessage(message: Message): Promise<void> {
    const msg: ToBackground.Message = { direction: 'from-content', ...message }
    return browser.runtime.sendMessage(msg)
  }
}

export namespace ToBackground {
  export type Message =
    | ({ direction: 'from-popup' } & FromPopUp.Message)
    | ({ direction: 'from-content' } & FromContent.Message)
}
