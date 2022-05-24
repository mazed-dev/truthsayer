import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'
import styled from '@emotion/styled'

export type Slice = {
  start: number
  end: number
}

export type ElementHighlight = {
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
  textContent: string | null,
  highlightPlaintext: string
): Slice | null => {
  textContent = textContent?.replace(/\s+/g, ' ') || ''
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
  while (
    !highlightPlaintext.startsWith(textContent.slice(start))
  ) {
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
  element: ChildNode,
  highlightPlaintext: string
): ElementHighlight[] {
  let [highlights, restOfhighlightPlaintext] = discoverHighlightsInElementTraverse(element, highlightPlaintext)
  let i=0;
  while(restOfhighlightPlaintext.length > 0 && element.nextSibling && i < 5) {
    element = element.nextSibling
    const [moreHighlights, restRestOfhighlightPlaintext] = discoverHighlightsInElementTraverse(
      element, restOfhighlightPlaintext)
    restOfhighlightPlaintext = restRestOfhighlightPlaintext
    highlights.push(...moreHighlights)
    i++
  }
  return highlights
}

function discoverHighlightsInElementTraverse(
  element: ChildNode,
  highlightPlaintext: string
): [ElementHighlight[], string] {
  let highlights: ElementHighlight[] = []
  for (let i = 0; i < element.childNodes.length; ++i) {
    const child = element.childNodes[i]
    if (child.nodeType === Node.TEXT_NODE && child.textContent != null) {
      const slice = getHighlightSlice(child.nodeValue, highlightPlaintext)
      if (slice !== null) {
        highlights.push({
          target: child,
          slice,
        })
        highlightPlaintext = highlightPlaintext.slice(slice.end - slice.start)
      }
    }
    const [moreHighlights, restOfhighlightPlaintext] = discoverHighlightsInElementTraverse(child, highlightPlaintext)
    highlightPlaintext = restOfhighlightPlaintext
    highlights.push(...moreHighlights)
  }
  return [highlights, highlightPlaintext]
}

export function renderInElementHighlight(
  { target, slice }: ElementHighlight,
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
  const parentNode = target.parentNode
  parentNode?.replaceChild(box, target)
  return () => {
    parentNode?.replaceChild(target, box)
  }
}

const HighlightedText = styled('mark')`
  text-decoration-line: underline;
  text-decoration-color: green;
  text-decoration-style: solid;
  text-decoration-thickness: 0.14em;
  background: inherit;
  color: inherit;

  &:hover {
    background: #b4ffb99e;
  }
`

export const HighlightAtom = ({
  target,
  slice,
}: {
  target: Node
  slice: Slice
}) => {
  const { textContent, parentNode } = target
  const box = document.createElement('mazed-highlighted-text')
  useEffect(() => {
    parentNode?.replaceChild(box, target)
    return () => {
      parentNode?.replaceChild(target, box)
    }
  })
  const prefix = textContent?.slice(0, slice.start)
  const highlighted = textContent?.slice(slice.start, slice.end)
  const suffix = textContent?.slice(slice.end)
  return ReactDOM.createPortal(
    <>
      {prefix}
      <HighlightedText>{highlighted}</HighlightedText>
      {suffix}
    </>,
    box
  )
}
