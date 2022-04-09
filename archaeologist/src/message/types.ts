import { WebPageContent } from './../extractor/webPageContent'
import { TNodeJson } from 'smuggler-api'

interface SavedStatusRequest {
  type: 'REQUEST_SAVED_NODE'
}

interface SavedStatusResponse {
  type: 'SAVED_NODE'
  bookmark?: TNodeJson
  quotes: TNodeJson[]
  unmemorable?: boolean
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
}

export type MessageType =
  | SavedStatusRequest
  | SavedStatusResponse
  | SavePageRequest
  | SavePageResponse
  | AuthStatusRequest
  | AuthStatusResponse
  | GetSelectedQuoteRequest
  | GetSelectedQuoteResponse

export const Message = {
  // This is just a hack to check the message type, needed because
  // browser.*.sendMessage takes any type as a message
  create: (msg: MessageType): MessageType => msg,
}
