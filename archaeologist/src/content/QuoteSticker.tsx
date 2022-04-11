import React, { useState } from 'react'
import styled from '@emotion/styled'

import { QuoteToolbar } from './QuoteToolbar'

// Almost all CSS properties are tagged as `!important` here to protect Mazed
// augmentation against overrides from WebPage CSS.

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

const Mark = styled.span`
  cursor: pointer !important;

  opacity: 0.4;
  &:hover {
    opacity: 0.6;
  }

  display: block;
  position: relative;
  width: 32px;
  height: calc(1em + 6px);
  background: #38b000 !important;

  &:after {
    content: '';
    position: absolute;
    left: 100%;
    top: 0;
    width: 0;
    height: 0;
    border-bottom: calc(1em + 6px) solid transparent !important;
    border-left: calc(1em + 1px) solid #38b000 !important;
  }
`

// z-index here is just a big enough number to make sure Mazed augmentation is
// rendered over everything else on a web page.
const BoxAbs = styled.span`
  position: absolute;
  top: -2px;
  left: -8px;
  z-index: 2022;
`

const BoxPad = styled.span`
  position: relative;
`

export const QuoteSticker = ({ nid }: { nid: string }) => {
  const [showButtons, setShowButtons] = useState<boolean>(false)
  const toolbar = showButtons ? (
    <QuoteToolbar nid={nid} onExit={() => setShowButtons(false)} />
  ) : null
  const onClick = () => {
    setShowButtons((value) => !value)
  }
  return (
    <Box id={nid}>
      <BoxAbs>
        <BoxPad>
          <Mark onClick={onClick} />
          {toolbar}
        </BoxPad>
      </BoxAbs>
    </Box>
  )
}
