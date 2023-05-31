import { log, diffStr } from 'armoury'

/**
 * Function to extract substring of smaller length from user's input to search
 * for suggestions. Mainly, goal is to extract the last edited paragraph based
 * on comparison with previous textContent and searchPhrase.
 */
export function getLastEditedParagrph(
  textContent: string,
  previousTextContent?: string
): null | string {
  if (textContent === previousTextContent) {
    log.debug(
      'The textContent is the same, no reason to look for suggestions again'
    )
    return null
  }
  let phrase: string
  if (previousTextContent == null) {
    // We can't guess what paragraph has been changed, let's play safe and use
    // the entire textContent to search for relatives
    phrase = textContent
  } else {
    let [start, end] = diffStr(textContent, previousTextContent)
    // Look for a newline starting from 1 spep ahead, backward. Because
    // specified position is included, to process correctly deleted characters
    // at the end of the paragraph right before newline symbol.
    start = textContent.lastIndexOf('\n', start - 1)
    if (start < 0) {
      // If there is no newline character before discovered diff, take text from
      // the begining of the `textContent` then.
      start = 0
    }
    end = textContent.indexOf('\n', end)
    if (end < 0) {
      // If there is no newline character after discovered diff, take text up to
      // the end of the `textContent` then.
      end = textContent.length
    }
    phrase = textContent.slice(start, end)
  }
  if (phrase.length < 4) {
    log.debug('The phrase is too short to look for suggestions', phrase)
    return null
  }
  return phrase.trim()
}
