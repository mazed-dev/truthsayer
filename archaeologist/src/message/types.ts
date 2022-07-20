import { WebPageContent } from './../content/extractor/webPageContent'
import { OriginHash, TNodeJson } from 'smuggler-api'
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

export interface VoidResponse {
  type: 'VOID_RESPONSE'
}

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
  export type Request =
    | SavePageRequest
    | PageInActiveTabStatusRequest
    | AuthStatusRequest

  export function sendMessage(
    message: AuthStatusRequest
  ): Promise<ToPopUp.AuthStatusResponse>
  export function sendMessage(
    message: SavePageRequest
  ): Promise<ToPopUp.PageSavedResponse>
  export function sendMessage(
    message: PageInActiveTabStatusRequest
  ): Promise<ToPopUp.ActiveTabStatusResponse>
  export function sendMessage(message: Request): Promise<ToPopUp.Response> {
    const msg: ToBackground.Request = { direction: 'from-popup', ...message }
    return browser.runtime.sendMessage(msg)
  }
}
export namespace ToPopUp {
  export interface AuthStatusResponse {
    type: 'AUTH_STATUS'
    status: boolean
  }
  export interface ActiveTabStatusResponse {
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
  export interface PageSavedResponse {
    type: 'PAGE_SAVED'
    success: boolean
    unmemorable?: boolean
  }

  export type Response =
    | AuthStatusResponse
    | ActiveTabStatusResponse
    | PageSavedResponse
  export function sendMessage(message: void): Promise<void> {
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
  export interface ShowDisappearingNotificationRequest {
    type: 'SHOW_DISAPPEARING_NOTIFICATION'
    text: string
    href?: string
    tooltip?: string
    timeoutMsec?: number
  }
  export type Request =
    | RequestPageContent
    | UpdateContentAugmentationRequest
    | GetSelectedQuoteRequest
    | ShowDisappearingNotificationRequest
  export function sendMessage(
    tabId: number,
    message: RequestPageContent
  ): Promise<FromContent.SavePageResponse>
  export function sendMessage(
    tabId: number,
    message: UpdateContentAugmentationRequest
  ): Promise<VoidResponse>
  export function sendMessage(
    tabId: number,
    message: GetSelectedQuoteRequest
  ): Promise<FromContent.GetSelectedQuoteResponse>
  export function sendMessage(
    tabId: number,
    message: ShowDisappearingNotificationRequest
  ): Promise<FromContent.GetSelectedQuoteResponse>
  export function sendMessage(
    tabId: number,
    message: Request
  ): Promise<FromContent.Response> {
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
    totalSeconds: number
    totalSecondsEstimation: number
  }
  export type Request = AttentionTimeChunk

  export type Response =
    | GetSelectedQuoteResponse
    | SavePageResponse
    | VoidResponse

  export function sendMessage(message: Request): Promise<VoidResponse> {
    const msg: ToBackground.Request = { direction: 'from-content', ...message }
    return browser.runtime.sendMessage(msg)
  }
}

export namespace ToBackground {
  export type Request =
    | ({ direction: 'from-popup' } & FromPopUp.Request)
    | ({ direction: 'from-content' } & FromContent.Request)
}
