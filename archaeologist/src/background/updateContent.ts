import { errorise, isAbortError, log } from 'armoury'
import { TNode } from 'smuggler-api'
import { ToContent, ToPopUp } from '../message/types'
import * as badge from '../badge/badge'

/**
 * Things that Mazed "knows" about a web page
 */
export type MazedPageData = {
  quotes: TNode[]
  bookmark?: TNode
  unmemorable?: boolean
}

/**
 * Update content (saved nodes) in:
 *   - Pop up window.
 *   - Content augmentation.
 *   - Badge counter.
 */
export async function updateContent(
  mode: 'append' | 'reset',
  data: MazedPageData,
  tabId?: number
): Promise<void> {
  const quotesJson = data.quotes.map((node) => node.toJson())
  const bookmarkJson = data.bookmark?.toJson()
  // Inform PopUp window of saved bookmark and web quotes
  try {
    await ToPopUp.sendMessage({
      type: 'UPDATE_POPUP_CARDS',
      bookmark: bookmarkJson,
      quotes: quotesJson,
      unmemorable: data?.unmemorable,
      mode,
    })
  } catch (err) {
    if (isAbortError(err)) {
      return
    }
    log.debug(
      'Sending message to pop up window failed, the window might not exist',
      err
    )
  }
  // Update badge counter
  let badgeText: string | undefined = '✓'
  if (mode === 'reset') {
    const n = data.quotes.length + (data?.bookmark != null ? 1 : 0)
    if (n !== 0) {
      badgeText = n.toString()
    } else {
      badgeText = undefined
    }
  }
  await badge.resetText(tabId, badgeText)
  // Update content augmentation
  if (tabId == null) {
    return
  }
  try {
    await ToContent.sendMessage(tabId, {
      type: 'REQUEST_UPDATE_CONTENT_AUGMENTATION',
      quotes: quotesJson,
      bookmark: bookmarkJson,
      mode,
    })
  } catch (exception) {
    const error = errorise(exception)
    if (isAbortError(error)) {
      return
    }
    if (error.message.search(/receiving end does not exist/i) >= 0) {
      log.debug(
        'Can not send augmentation to the current tab, content script is not listening',
        error
      )
      return
    }
    log.exception(error, 'Content augmentation sending failed')
  }
}
