import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'
import styled from '@emotion/styled'
import { jsx } from '@emotion/react'

import { QuoteToolbar } from './QuoteToolbar'

import { Slice, discoverHighlightsInElement } from './highlight'

const HighlightedText = styled('mark')`
  text-decoration-line: underline !important;
  text-decoration-color: #00a8008a !important;
  text-decoration-style: solid !important;
  text-decoration-thickness: 0.14em !important;
  background: inherit !important;
  color: inherit !important;

  mazed-toolbar {
    visibility: hidden;
    opacity: 0;
    transition: visibility 0s, opacity 0.1s easy;
    transition-delay: 0.2s;
  }

  &:hover {
    text-decoration-color: #00a800de !important;
    text-decoration-thickness: 0.18em !important;

    mazed-toolbar {
      visibility: visible;
      opacity: 1;
    }
  }
`

const BoxCustom = ({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) => {
  // Wrap toolbar up in a custom tag to minize risk of breaking page HTML
  return jsx('mazed-toolbar', { className }, children)
}

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

  height: 0 !important;
  width: 0 !important;
`
const BoxAbs = styled.span`
  position: absolute !important;
  bottom: 100% !important;
  left: 8px !important;
  z-index: 2022 !important;
`

const BoxPad = styled.span`
  position: relative !important;
`

/**
 * The element replaces target element in original DOM with a new element `box`
 * that contains highlighted text.
 *
 * Behold, this element is part of React state, but not part of the DOM created
 * by React, because we use `createPortal`. It gets injected into page HTML,
 * that is being agumented.
 */
export const HighlightAtom = ({
  nid,
  target,
  slice,
}: {
  nid: string
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
      <HighlightedText>
        <BoxCustom>
          <Box>
            <BoxAbs>
              <BoxPad>
                <QuoteToolbar nid={nid} onExit={() => {}} />
              </BoxPad>
            </BoxAbs>
          </Box>
        </BoxCustom>
        {highlighted}
      </HighlightedText>
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
  const atoms = discoverHighlightsInElement(target, highlightPlaintext).map(
    ({ target: element, slice }, index) => {
      const key = `${nid}_${index}`
      console.log('discoverHighlightsInElement::element', element, slice, key)
      return (
        <HighlightAtom key={key} nid={nid} target={element} slice={slice} />
      )
    }
  )
  return <>{atoms}</>
}
