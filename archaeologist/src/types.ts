import { WebPageContent } from './webPageContent'

interface SavedStatusRequest {
  type: 'REQ_SAVED_STATUS'
}

interface SavedStatusResponse {
  type: 'SAVED_STATUS'
  saved: boolean
}

/**
 * Save page command chain
 * [ User -> popup.ts -> REQ_SAVE_PAGE ]
 * -> [ REQ_SAVE_PAGE -> background.ts -> REQ_SAVE_PAGE ]
 * -> [ REQ_SAVE_PAGE -> content.ts -> SAVE_PAGE ]
 * -> [ SAVE_PAGE -> background.ts ]
 */
interface SavePageRequest {
  type: 'REQ_SAVE_PAGE'
}

interface SavePageResponse {
  type: 'SAVE_PAGE'
  url: string
  content: WebPageContent
}

export type MessageTypes =
  | SavedStatusRequest
  | SavedStatusResponse
  | SavePageRequest
  | SavePageResponse
