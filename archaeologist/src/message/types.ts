import { AccountInfo, PreviewImageSmall, SessionCreateArgs } from 'smuggler-api'
import type { LongestCommonContinuousPiece } from 'text-information-retrieval'
import browser from 'webextension-polyfill'
import type {
  Nid,
  OriginHash,
  StorageApiMsgPayload,
  StorageApiMsgReturnValue,
  TNodeJson,
  NodeUpdateArgs,
} from 'smuggler-api'
import { AnalyticsIdentity, OriginIdentity } from 'armoury'
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

export type RelevantNodeSuggestion = {
  node: TNodeJson
  /**
   * Most relevant quote from the node
   */
  matchedPiece?: LongestCommonContinuousPiece
}

export namespace FromPopUp {
  export interface AppStatusRequest {
    type: 'REQUEST_APP_STATUS'
  }
  export interface LogInRequest {
    type: 'REQUEST_TO_LOG_IN'
    args: SessionCreateArgs
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
  export interface UpdateNodeRequest {
    type: 'REQUEST_UPDATE_NODE'
    args: NodeUpdateArgs
  }
  export type Request =
    | SavePageRequest
    | PageInActiveTabStatusRequest
    | AppStatusRequest
    | LogInRequest
    | StorageAccessRequest
    | GetSuggestionsToPageInActiveTabRequest
    | UpdateNodeRequest

  export function sendMessage(
    message: AppStatusRequest
  ): Promise<ToPopUp.AppStatusResponse>
  export function sendMessage(
    message: LogInRequest
  ): Promise<ToPopUp.LogInResponse>
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
  export function sendMessage(message: UpdateNodeRequest): Promise<VoidResponse>
  export function sendMessage(message: Request): Promise<ToPopUp.Response> {
    const msg: ToBackground.Request = { direction: 'from-popup', ...message }
    return browser.runtime.sendMessage(msg).catch((error) => {
      throw new Error(`Failed to send ${message.type} from popup: ${error}`)
    })
  }
}
export namespace ToPopUp {
  export interface AppStatusResponse {
    type: 'APP_STATUS_RESPONSE'
    analyticsIdentity: AnalyticsIdentity
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
    suggestedAkinNodes: RelevantNodeSuggestion[]
  }

  export type LogInResponse = {
    type: 'RESPONSE_LOG_IN'
    user: AccountInfo
  }

  export type Response =
    | AppStatusResponse
    | ActiveTabStatusResponse
    | PageSavedResponse
    | StorageAccessResponse
    | VoidResponse
    | LogInResponse
    | GetSuggestionsToPageInActiveTabResponse
  export function sendMessage(message: undefined): Promise<undefined> {
    return browser.runtime.sendMessage(message)
  }
}

export type ContentAppOperationMode =
  /**
   * Mode in which content app is only allowed to act as a passive responder
   * to requests received from other parts of the system
   * (publishing metrics, sending @see FromContent.Request etc are disallowed).
   */
  | { type: 'passive-mode-content-app' }
  /**
   * Mode in which content app is allowed to perform actions on its own,
   * without an explicit request from a different part of the system
   * (@see FromContent.Request are allowed).
   */
  | { type: 'active-mode-content-app'; analyticsIdentity: AnalyticsIdentity }

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
    suggested: RelevantNodeSuggestion[]
  }
  export interface RequestPageContentSearchPhrase {
    type: 'REQUEST_PAGE_CONTENT_SEARCH_PHRASE'
  }

  /** Requests that aim to modify recepient's state. */
  export type MutatingRequest =
    | InitContentAugmentationRequest
    | UpdateContentAugmentationRequest
    | ShowDisappearingNotificationRequest
  /** Requests that aim to retrieve part of recepient's state without modifying it. */
  export type ReadOnlyRequest =
    | RequestPageContent
    | GetSelectedQuoteRequest
    | RequestPageContentSearchPhrase
  /** Requests that are sent to content only to be forwarded somewhere else. */
  export type PassthroughRequest = ReportBackgroundOperationProgress

  export type Request = MutatingRequest | ReadOnlyRequest | PassthroughRequest

  export type Response =
    | VoidResponse
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
    message: RequestPageContentSearchPhrase
  ): Promise<FromContent.PageContentSearchPhraseResponse>
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
  export type PageContentSearchPhraseResponse = {
    type: 'PAGE_CONTENT_SEARCH_PHRASE_RESPONSE'
    phrase?: string
    nidsExcludedFromSearch: Nid[]
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

  export interface SuggestedAssociationsRequest {
    type: 'REQUEST_SUGGESTED_CONTENT_ASSOCIATIONS'
    phrase: string
    limit: number
    excludeNids?: Nid[]
  }
  export interface ContentAugmentationSettingsRequest {
    type: 'REQUEST_CONTENT_AUGMENTATION_SETTINGS'
    // Reset settings if provided in the request, if not just return previously
    // saved settings
    settings?: ContentAugmentationSettings
  }

  export type Request =
    | AttentionTimeChunk
    | SuggestedAssociationsRequest
    | StorageAccessRequest
    | ContentAugmentationSettingsRequest

  export type Response =
    | GetSelectedQuoteResponse
    | SavePageResponse
    | PageAlreadySavedResponse
    | PageNotWorthSavingResponse
    | VoidResponse
    | PageContentSearchPhraseResponse

  export function sendMessage(
    message: AttentionTimeChunk
  ): Promise<VoidResponse>
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
  export type RequestDirection = 'from-popup' | 'from-content'
  export type Request =
    | ({ direction: 'from-popup' } & FromPopUp.Request)
    | ({ direction: 'from-content' } & FromContent.Request)
}
export namespace FromBackground {
  export type Response = ToPopUp.Response | ToContent.Response

  type InitPhase = 'not-init' | 'loading' | 'unloading' | 'init-done'
  /**
   * Exception thrown if background has received a request, but failed
   * to process it because it was in the phase of initialization that is
   * incompatible with the request.
   */
  export class IncompatibleInitPhase extends Error {
    phase: {
      expected: InitPhase
      actual: InitPhase
    }
    reason?: string

    constructor(
      phase: { expected: InitPhase; actual: InitPhase },
      reason?: string
    ) {
      let message =
        `background unexpectedly had state '${phase.actual}' ` +
        `(expected '${phase.expected}')`
      if (reason) {
        message += `: ${reason}`
      }
      super(message)
      this.name = 'IncompatibleInitPhase'
      this.phase = phase
      this.reason = reason
    }
  }

  export function isIncompatibleInitPhase(
    value: any
  ): value is IncompatibleInitPhase {
    return value instanceof Error && value.name === 'IncompatibleInitPhase'
  }
}
