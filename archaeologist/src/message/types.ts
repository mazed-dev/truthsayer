import { WebPageContent } from './../extractor/webPageContent'

interface SavedStatusRequest {
  type: 'REQUEST_SAVED_STATUS'
}

interface SavedStatusResponse {
  type: 'SAVED_STATUS'
  nid: string | null
}

interface OriginIdRequest {
  type: 'REQUEST_PAGE_ORIGIN_ID'
}

interface OriginIdResponse {
  type: 'PAGE_ORIGIN_ID'
  originId: number
}

interface AuthStatusRequest {
  type: 'REQUEST_AUTH_STATUS'
}

interface AuthStatusResponse {
  type: 'AUTH_STATUS'
  status: boolean
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
  content: WebPageContent
}

export type MessageTypes =
  | SavedStatusRequest
  | SavedStatusResponse
  | SavePageRequest
  | SavePageResponse
  | AuthStatusRequest
  | AuthStatusResponse
  | OriginIdRequest
  | OriginIdResponse
