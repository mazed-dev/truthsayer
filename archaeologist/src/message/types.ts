import { PreviewImageSmall } from 'smuggler-api'

import browser from 'webextension-polyfill'
import type {
  OriginHash,
  StorageApiMsgPayload,
  StorageApiMsgReturnValue,
  TNodeJson,
} from 'smuggler-api'
import { OriginIdentity } from 'armoury'
import type {
  BackgroundAction,
  BackgroundActionProgress,
} from 'truthsayer-archaeologist-communication'

/**
 * There are 3 kinds of message senders/receivers:
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
 * Additionally, truthsayer can communicate with background.
 * @see FromTruthsayer outside of this module for that.
 *
 *   ┌───────┐       ┌────────────┐       ┌─────────┐
 *   │ popup │  ──▷  │ background │  ──▷  │ content │─┐
 *   └───────┘  ◁──  └────────────┘  ◁──  └───(#1)──┘ │─┐
 *                         ^                 └───(#2)──┘ │
 *                         :                   └───(#3)──┘
 *                         :
 *                 ◦◦◦◦◦◦◦◦◦◦◦◦◦◦◦◦◦◦◦
 *                 ◦    truthsayer   ◦
 *                 ◦  (outside this  ◦
 *                 ◦     module)     ◦
 *                 ◦◦◦◦◦◦◦◦◦◦◦◦◦◦◦◦◦◦◦
 */

export interface VoidResponse {
  type: 'VOID_RESPONSE'
}

/**
 * Request that makes @file storage_api_msg_proxy.ts work
 */
export type StorageAccessRequest = {
  type: 'MSG_PROXY_STORAGE_ACCESS_REQUEST'
  payload: StorageApiMsgPayload
}

export type StorageAccessResponse = {
  type: 'MSG_PROXY_STORAGE_ACCESS_RESPONSE'
  value: StorageApiMsgReturnValue
}

export type ContentAugmentationPosition = {
  x: number
  y: number
}
export type ContentAugmentationSettings = {
  isRevealed?: boolean
  positionY?: number
}
export interface ContentAugmentationSettingsResponse {
  type: 'RESPONSE_CONTENT_AUGMENTATION_SETTINGS'
  state: ContentAugmentationSettings
}
export interface WebPageContent {
  url: string
  title: string | null
  description: string | null
  lang: string | null
  author: string[]
  publisher: string[]
  text: string | null
  image: PreviewImageSmall | null
}

export namespace FromPopUp {
  export interface AuthStatusRequest {
    type: 'REQUEST_AUTH_STATUS'
  }

  export interface PageInActiveTabStatusRequest {
    type: 'REQUEST_PAGE_IN_ACTIVE_TAB_STATUS'
  }
  export interface GetSuggestionsToPageInActiveTabRequest {
    type: 'REQUEST_SUGGESTIONS_TO_PAGE_IN_ACTIVE_TAB'
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
    | StorageAccessRequest
    | GetSuggestionsToPageInActiveTabRequest

  export function sendMessage(
    message: AuthStatusRequest
  ): Promise<ToPopUp.AuthStatusResponse>
  export function sendMessage(
    message: SavePageRequest
  ): Promise<ToPopUp.PageSavedResponse>
  export function sendMessage(
    message: PageInActiveTabStatusRequest
  ): Promise<ToPopUp.ActiveTabStatusResponse>
  export function sendMessage(
    message: GetSuggestionsToPageInActiveTabRequest
  ): Promise<ToPopUp.GetSuggestionsToPageInActiveTabResponse>
  export function sendMessage(
    message: StorageAccessRequest
  ): Promise<StorageAccessResponse>
  export function sendMessage(message: Request): Promise<ToPopUp.Response> {
    const msg: ToBackground.Request = { direction: 'from-popup', ...message }
    return browser.runtime.sendMessage(msg).catch((error) => {
      throw new Error(`Failed to send ${message.type} from popup: ${error}`)
    })
  }
}
export namespace ToPopUp {
  export interface AuthStatusResponse {
    type: 'AUTH_STATUS'
    /** If undefined - user not logged in, otherwise - user's UID (@see AccountInterface.getUid() ) */
    userUid?: string
  }
  export interface ActiveTabStatusResponse {
    type: 'UPDATE_POPUP_CARDS'
    bookmark?: TNodeJson
    unmemorable?: boolean
    fromNodes: TNodeJson[]
    toNodes: TNodeJson[]
    // 'reset':
    //    - for quotes and bookmark, reset (replace) existing ones in PopUp window
    // 'append':
    //    - for quotes append quotes to existing ones in PopUp window
    //    - for bookmark, replace existing one in PopUp window, if specified
    mode: 'reset' | 'append'
  }
  export interface PageSavedResponse {
    type: 'PAGE_SAVED'
    bookmark?: TNodeJson
    unmemorable?: boolean
  }
  export interface GetSuggestionsToPageInActiveTabResponse {
    type: 'RESPONSE_SUGGESTIONS_TO_PAGE_IN_ACTIVE_TAB'
    suggestedAkinNodes: TNodeJson[]
  }

  export type Response =
    | AuthStatusResponse
    | ActiveTabStatusResponse
    | PageSavedResponse
    | StorageAccessResponse
    | VoidResponse
    | GetSuggestionsToPageInActiveTabResponse
  export function sendMessage(message: undefined): Promise<undefined> {
    return browser.runtime.sendMessage(message)
  }
}

export type ContentAppOperationMode =
  /**
   * Mode in which content app is only allowed to act as a passive responder
   * to requests received from other parts of the system
   * (@see FromContent.Request are disallowed).
   */
  | 'passive-mode-content-app'
  /**
   * Mode in which content app is allowed to perform actions on its own,
   * without an explicit request from a different part of the system
   * (@see FromContent.Request are allowed).
   */
  | 'active-mode-content-app'

export type BrowserHistoryUploadMode =
  /** Mode in which the progress will be tracked by Mazed and, if the process is
   * interrupted, then on restart the upload will start from the beginning.
   */
  | { mode: 'untracked'; unixtime: { start: number; end: number } }
  /** Mode in which the progress will be tracked by Mazed and, if the process is
   * interrupted, then on restart the upload will resume where it previously ended.
   */
  | { mode: 'resumable' }

/* Value of process.env.NODE_ENV (options come from react-scripts.NodeJS.ProcessEnv.NodeEnv) */
export type NodeEnv = 'development' | 'production' | 'test'

export namespace ToContent {
  export interface RequestPageContent {
    type: 'REQUEST_PAGE_CONTENT'
    /** If true, request is initiated because of user's explicit decision.
     * Otherwise - request is initiated per decision of Mazed automation.
     *
     * Verification of whether or not content of a page is worth saving are
     * less strict for manual actions as it is assumed the user knows what they
     * want.
     */
    manualAction: boolean
  }
  export interface UpdateContentAugmentationRequest {
    type: 'REQUEST_UPDATE_CONTENT_AUGMENTATION'
    fromNodes: TNodeJson[]
    toNodes: TNodeJson[]
    bookmark?: TNodeJson
    mode: 'reset' | 'append'
  }
  /**
   * Request to init the state of content app when page loads completely.
   * There are rather tricky ways to monitor it from inside the content script,
   * but very easy from background script.
   */
  export interface InitContentAugmentationRequest {
    type: 'INIT_CONTENT_AUGMENTATION_REQUEST'
    mode: ContentAppOperationMode
    nodeEnv: NodeEnv
    userUid: string
    fromNodes: TNodeJson[]
    toNodes: TNodeJson[]
    bookmark?: TNodeJson
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
  export interface ReportBackgroundOperationProgress {
    type: 'REPORT_BACKGROUND_OPERATION_PROGRESS'
    operation: BackgroundAction
    newState: BackgroundActionProgress
  }
  export interface SuggestedAssociationsResponse {
    type: 'SUGGESTED_CONTENT_ASSOCIATIONS'
    suggested: TNodeJson[]
  }

  /** Requests that aim to modify recepient's state. */
  export type MutatingRequest =
    | InitContentAugmentationRequest
    | UpdateContentAugmentationRequest
    | ShowDisappearingNotificationRequest
    | ReportBackgroundOperationProgress
  /** Requests that aim to retrieve part of recepient's state without modifying it. */
  export type ReadOnlyRequest = RequestPageContent | GetSelectedQuoteRequest

  export type Request = MutatingRequest | ReadOnlyRequest

  export interface DeletePreviouslyUploadedBrowserHistoryResponse {
    type: 'DELETE_PREVIOUSLY_UPLOADED_BROWSER_HISTORY'
    numDeleted: number
  }
  export type Response =
    | VoidResponse
    | DeletePreviouslyUploadedBrowserHistoryResponse
    | SuggestedAssociationsResponse
    | StorageAccessResponse
    | ContentAugmentationSettingsResponse

  export function sendMessage(
    tabId: number,
    message: RequestPageContent
  ): Promise<
    | FromContent.SavePageResponse
    | FromContent.PageAlreadySavedResponse
    | FromContent.PageNotWorthSavingResponse
  >
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
  ): Promise<VoidResponse>
  export function sendMessage(
    tabId: number,
    message: InitContentAugmentationRequest
  ): Promise<VoidResponse>
  export function sendMessage(
    tabId: number,
    message: ReportBackgroundOperationProgress
  ): Promise<VoidResponse>
  export function sendMessage(
    tabId: number,
    message: Request
  ): Promise<FromContent.Response>
  export function sendMessage(
    tabId: number,
    message: Request
  ): Promise<FromContent.Response> {
    return browser.tabs.sendMessage(tabId, message).catch((error) => {
      throw new Error(
        `Failed to send ${message.type} to content (tabId = ${tabId}): ${error}`
      )
    })
  }

  export function sendMessageToAll(
    tabIds: number[],
    message: Request
  ): Promise<PromiseSettledResult<FromContent.Response>[]> {
    let promises: Promise<FromContent.Response>[] = []
    for (const tabId of tabIds) {
      promises.push(sendMessage(tabId, message))
    }
    return Promise.allSettled(promises)
  }
}
export namespace FromContent {
  export type SaveablePage = {
    url: string
    originId: OriginHash
    // Missing content is for a page that can not be saved
    content?: WebPageContent
    // Saving page quotes to connect as right hand side cards
    quoteNids: string[]
  }

  export type SavePageResponse = {
    type: 'PAGE_TO_SAVE'
  } & SaveablePage
  export interface PageAlreadySavedResponse {
    type: 'PAGE_ALREADY_SAVED'
    bookmark: TNodeJson
    fromNodes: TNodeJson[]
    toNodes: TNodeJson[]
  }
  export interface PageNotWorthSavingResponse {
    type: 'PAGE_NOT_WORTH_SAVING'
  }
  export interface GetSelectedQuoteResponse {
    type: 'SELECTED_WEB_QUOTE'
    text: string
    path: string[]
    url: string
    lang?: string
    // If specified, the requested web quote is connected to the bookmark on the
    // right hand side
    fromNid?: string
  }
  /** Describes for how long a user actively paid attention to a particular webpage */
  export interface AttentionTimeChunk {
    type: 'ATTENTION_TIME_CHUNK'
    deltaSeconds: number
    totalSecondsEstimation: number
    origin: OriginIdentity
  }

  export type UploadBrowserHistoryRequest = {
    type: 'UPLOAD_BROWSER_HISTORY'
  } & BrowserHistoryUploadMode
  export interface CancelBrowserHistoryUploadRequest {
    type: 'CANCEL_BROWSER_HISTORY_UPLOAD'
  }
  export interface DeletePreviouslyUploadedBrowserHistoryRequest {
    type: 'DELETE_PREVIOUSLY_UPLOADED_BROWSER_HISTORY'
  }
  export interface SuggestedAssociationsRequest {
    type: 'REQUEST_SUGGESTED_CONTENT_ASSOCIATIONS'
    phrase: string
    limit: number
  }
  export interface ContentAugmentationSettingsRequest {
    type: 'REQUEST_CONTENT_AUGMENTATION_SETTINGS'
    // Reset settings if provided in the request, if not just return previously
    // saved settings
    settings?: ContentAugmentationSettings
  }

  export type Request =
    | AttentionTimeChunk
    | UploadBrowserHistoryRequest
    | CancelBrowserHistoryUploadRequest
    | DeletePreviouslyUploadedBrowserHistoryRequest
    | SuggestedAssociationsRequest
    | StorageAccessRequest
    | ContentAugmentationSettingsRequest

  export type Response =
    | GetSelectedQuoteResponse
    | SavePageResponse
    | PageAlreadySavedResponse
    | PageNotWorthSavingResponse
    | VoidResponse

  export function sendMessage(
    message: AttentionTimeChunk
  ): Promise<VoidResponse>
  export function sendMessage(
    message: UploadBrowserHistoryRequest
  ): Promise<VoidResponse>
  export function sendMessage(
    message: CancelBrowserHistoryUploadRequest
  ): Promise<VoidResponse>
  export function sendMessage(
    message: DeletePreviouslyUploadedBrowserHistoryRequest
  ): Promise<ToContent.DeletePreviouslyUploadedBrowserHistoryResponse>
  export function sendMessage(
    message: SuggestedAssociationsRequest
  ): Promise<ToContent.SuggestedAssociationsResponse>
  export function sendMessage(
    message: StorageAccessRequest
  ): Promise<StorageAccessResponse>
  export function sendMessage(
    message: StorageAccessRequest
  ): Promise<StorageAccessResponse>
  export function sendMessage(
    message: ContentAugmentationSettingsRequest
  ): Promise<ContentAugmentationSettingsResponse>
  export function sendMessage(message: Request): Promise<ToContent.Response> {
    const msg: ToBackground.Request = { direction: 'from-content', ...message }
    return browser.runtime.sendMessage(msg).catch((error) => {
      throw new Error(`Failed to send ${message.type} from content: ${error}`)
    })
  }
}

export namespace ToBackground {
  export type Request =
    | ({ direction: 'from-popup' } & FromPopUp.Request)
    | ({ direction: 'from-content' } & FromContent.Request)
}
