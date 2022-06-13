export type Slice = {
  start: number
  end: number
}

export type ElementHighlight = {
  target: Node
  slice: Slice
}

/**
 * Get slice of textContent for given highlighted text.
 * (exported only for test purposes)
 *
 * See examples below:
 * 1 |<--textContent-->|
 *   |<-highlight->|
 *
 * 2 |<--textContent-->|
 *   |<---highlight--->|
 *
 * 3 |<--textContent-->|
 *     |<-highlight->|
 *
 * 4 |<--textContent-->|
 *       |<-highlight->|
 *
 * 5 |<--textContent-->|
 *   |<-----highlight----->|
 *
 * 6 |<--textContent-->|
 *           |<--highlight-->|
 */
export const getHighlightSlice = (
  textContent: string | null,
  highlightPlaintext: string
): Slice | null => {
  // We replaces non-breaking spaces with ASCII space. Because Firefox is a
  // weirdo, it replaces all non-breaking spaces with ASCII spaces in
  // selectionText. So here, we have to make sure there is non of such spaces
  // left in both highlightPlaintext and textContent.
  textContent = (textContent || '').replace(/\u00A0/g, ' ')
  highlightPlaintext = highlightPlaintext.replace(/\u00A0/g, ' ')
  if (highlightPlaintext.length === 0) {
    return null
  }
  if (highlightPlaintext.length <= textContent.length) {
    const start = textContent.indexOf(highlightPlaintext)
    if (start >= 0) {
      // Hooray, full string discovered
      return { start, end: start + highlightPlaintext.length }
    }
  }
  let start = 0
  while (!highlightPlaintext.startsWith(textContent.slice(start))) {
    start++
  }
  const end = textContent.length
  if (start === end) {
    return null
  }
  return { start, end }
}

/**
 * Discover all elements with highlighted text in given element recursively.
 *
 * @param element - element, that contains highlighted text.
 * @param highlightPlaintext - plain text to highlight in given element.
 */
export function discoverHighlightsInElement(
  element: ChildNode | null,
  highlightPlaintext: string
): ElementHighlight[] {
  const highlights: ElementHighlight[] = []
  // Some arbitrary limit to avoid performance issuesrelated to big highlights
  let infLoopProtection = 16
  while (
    highlightPlaintext.length > 0 &&
    element != null &&
    infLoopProtection > 0
  ) {
    const [moreHighlights, text] = discoverHighlightsInElementTraverse(
      element,
      highlightPlaintext
    )
    highlightPlaintext = text
    element = element?.nextSibling || null
    highlights.push(...moreHighlights)
    --infLoopProtection
  }
  return highlights
}

function discoverHighlightsInElementTraverse(
  element: ChildNode,
  highlightPlaintext: string
): [ElementHighlight[], string] {
  let highlights: ElementHighlight[] = []
  if (element.nodeType === Node.TEXT_NODE) {
    const slice = getHighlightSlice(element.textContent, highlightPlaintext)
    if (slice !== null) {
      highlights.push({
        target: element,
        slice,
      })
      highlightPlaintext = highlightPlaintext.slice(slice.end - slice.start)
    }
  }
  for (let i = 0; i < element.childNodes.length; ++i) {
    const child = element.childNodes[i]
    const [moreHighlights, restOfhighlightPlaintext] =
      discoverHighlightsInElementTraverse(child, highlightPlaintext)
    highlightPlaintext = restOfhighlightPlaintext
    highlights.push(...moreHighlights)
  }
  return [highlights, highlightPlaintext]
}
