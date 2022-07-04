import { WebPageContent } from './../content/extractor/webPageContent'
import { TNodeJson } from 'smuggler-api'

interface PageInActiveTabStatusRequest {
  type: 'REQUEST_PAGE_IN_ACTIVE_TAB_STATUS'
}

interface UpdatePopUpCards {
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

interface AuthStatusRequest {
  type: 'REQUEST_AUTH_STATUS'
}

interface AuthStatusResponse {
  type: 'AUTH_STATUS'
  status: boolean
}

interface GetSelectedQuoteRequest {
  type: 'REQUEST_SELECTED_WEB_QUOTE'
  text: string
}

interface GetSelectedQuoteResponse {
  type: 'SELECTED_WEB_QUOTE'
  text: string
  path: string[]
  url: string
  originId: number
  lang?: string
  // If specified, the requested web quote is connected to the bookmark on the
  // right hand side
  fromNid?: string
}

interface UpdateContentAugmentationRequest {
  type: 'REQUEST_UPDATE_CONTENT_AUGMENTATION'
  quotes: TNodeJson[]
  bookmark?: TNodeJson
  mode: 'reset' | 'append'
}

/**
 * Save page command chain
 * [ User -> popup.ts -> REQUEST_PAGE_TO_SAVE ]
 * -> [ REQUEST_PAGE_TO_SAVE -> background.ts -> REQUEST_PAGE_TO_SAVE ]
 * -> [ REQUEST_PAGE_TO_SAVE -> content.ts -> PAGE_TO_SAVE ]
 * -> [ PAGE_TO_SAVE -> background.ts ]
 */
interface SavePageRequest {
  type: 'REQUEST_PAGE_TO_SAVE'
}

interface SavePageResponse {
  type: 'PAGE_TO_SAVE'
  url: string
  originId: number
  // Missing content is for a page that can not be saved
  content?: WebPageContent
  // Saving page quotes to connect as right hand side cards
  quoteNids: string[]
}

namespace ToContent {
  export interface ShowDisappearingNotification {
    type: 'SHOW_DISAPPEARING_NOTIFICATION'
    text: string
    href?: string
    tooltip?: string
    timeoutMsec?: number
  }
}

export type MessageType =
  | PageInActiveTabStatusRequest
  | UpdatePopUpCards
  | SavePageRequest
  | SavePageResponse
  | AuthStatusRequest
  | AuthStatusResponse
  | GetSelectedQuoteRequest
  | GetSelectedQuoteResponse
  | UpdateContentAugmentationRequest
  | ToContent.ShowDisappearingNotification

export const Message = {
  // This is just a hack to check the message type, needed because
  // browser.*.sendMessage takes any type as a message
  create: (msg: MessageType): MessageType => msg,
}
