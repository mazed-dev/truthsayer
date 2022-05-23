import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'

export type Slice = {
  start: number
  end: number
}

export type Highlight = {
  target: Node
  slice: Slice
}

/*
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
  textContent: string,
  highlightPlaintext: string
): Slice | null => {
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
  let start = 0 // Math.min(textContent.length, highlightPlaintext.length)
  let end = textContent.length
  //while (!textContent.endsWith(highlightPlaintext.slice(0, end)) && end >= 0) {
  while (
    !highlightPlaintext.startsWith(textContent.slice(start, end)) &&
    start !== end
  ) {
    start++
  }
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
  element: ChildNode,
  highlightPlaintext: string
): Highlight[] {
  let highlights: Highlight[] = []
  for (let i = 0; i < element.childNodes.length; ++i) {
    const child = element.childNodes[i]
    if (child.nodeType === Node.TEXT_NODE && child.textContent != null) {
      const slice = getHighlightSlice(child.textContent, highlightPlaintext)
      if (slice !== null) {
        highlights.push({
          target: child,
          slice,
        })
        highlightPlaintext = highlightPlaintext.slice(slice.end - slice.start)
      }
    }
    highlights.push(...discoverHighlightsInElement(child, highlightPlaintext))
  }
  return highlights
}

export function renderInElementHighlight(
  { target, slice }: Highlight,
  document_: Document
) {
  const text = target.textContent
  const highlighted = text?.slice(slice.start, slice.end)
  if (!highlighted) {
    return () => {}
  }
  const box = document_.createElement('mazed-highlight-box')
  const mark = document_.createElement('mazed-highlight')
  mark.textContent = highlighted
  const prefix = text?.slice(0, slice.start)
  const suffix = text?.slice(slice.end)
  if (prefix) {
    box.appendChild(document_.createTextNode(prefix))
  }
  box.appendChild(mark)
  if (suffix) {
    box.appendChild(document_.createTextNode(suffix))
  }
  target.parentNode?.replaceChild(box, target)
  return () => {
    box.parentNode?.replaceChild(target, box)
  }
}
