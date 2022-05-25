import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import styled from '@emotion/styled'

import { QuoteToolbar } from '../QuoteToolbar'
import { PrependSocket } from '../Socket'

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
  textContent = textContent || ''
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
  text-decoration-color: #00a8008a;
  text-decoration-style: solid;
  text-decoration-thickness: 0.14em;
  background: inherit;
  color: inherit;

  &:hover {
    text-decoration-color: #00a800de;
    text-decoration-thickness: 0.18em;
  }
`

const Box = styled.span`
  position: relative !important;

  background-color: grey !important;
  color: green !important;
  font-style: normal !important;
  font-weight: 400 !important;
  text-transform: none !important;
  text-decoration: none !important;
  text-shadow: none !important;
  text-align: right !important;
  letter-spacing: normal !important;
  line-height: normal !important;
  vertical-align: middle;

  height: 0;
  width: 0;
`
const BoxAbs = styled.span`
  position: absolute;
  top: -2px;
  left: -8px;
  z-index: 2022;
`

const BoxPad = styled.span`
  position: relative;
`

export const HighlightAtom = ({
  target,
  slice,
  onClick,
}: {
  target: Node
  slice: Slice
  onClick: () => void
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
      <HighlightedText onClick={onClick}>{highlighted}</HighlightedText>
      {suffix}
    </>,
    box
  )
}

export const QuoteHighlight = ({
  nid,
  target,
  highlightPlaintext,
}: {
  nid: string
  target: Element
  highlightPlaintext: string
}) => {
  const [showToolbar, setShowToolbar] = useState<boolean>(false)
  const atoms = discoverHighlightsInElement(target, highlightPlaintext).map(
    ({ target, slice }, index) => {
      const key = `${nid}_${index}`
      return (
        <HighlightAtom
          key={key}
          target={target}
          slice={slice}
          onClick={() => setShowToolbar((value) => !value)}
        />
      )
    }
  )
  const toolbar = showToolbar ? (
    <QuoteToolbar nid={nid} onExit={() => {}} />
  ) : null
  return (
    <>
      <PrependSocket target={target}>
        <Box>
          <BoxAbs>
            <BoxPad>{toolbar}</BoxPad>
          </BoxAbs>
        </Box>
      </PrependSocket>
      {atoms}
    </>
  )
}
