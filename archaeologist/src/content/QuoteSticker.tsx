import React from 'react'
import styled from '@emotion/styled'

// All CSS properties are tagged as `!important` here to protect Mazed
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

  height: 0;
  width: 0;
`

const Mark = styled.span`
  cursor: pointer !important;

  opacity: 0.5;
  &:hover {
    opacity: 1;
  }

  display: block;
  position: relative;
  width: 8px;
  height: 24px;
  background: #38b000 !important;

  &:after {
    content: '';
    position: absolute;
    left: 100%;
    top: 0;
    width: 0;
    height: 0;
    border-top: 12px solid transparent !important;
    border-left: 8px solid #38b000 !important;
    border-bottom: 12px solid transparent !important;
  }
`

// z-index here is just a big enough number to make sure Mazed augmentation is
// rendered over everything else on a web page.
const BoxAbs = styled.span`
  position: absolute;
  left: calc(0px - 1em - 2px);
  z-index: 2022;
`

const BoxPad = styled.span`
  position: relative;
`

export const QuoteSticker = ({ nid }: { nid: string }) => {
  return (
    <Box id={nid}>
      <BoxAbs>
        <BoxPad>
          <Mark />
        </BoxPad>
      </BoxAbs>
    </Box>
  )
}
