import React from 'react'
import styled from '@emotion/styled'

const Box = styled.span`
  position: relative;

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

  height: 0 !important;
  width: 0 !important;
`

const Mark = styled.span`
  cursor: pointer !important;

  opacity: 0.6;
  &:hover {
    opacity: 1;
  }

  display: block;
  position: relative;
  width: 4px;
  height: 24px;
  background: #38b000;

  &:after {
    content: "";
    position: absolute;
    left: 100%;
    top: 0;
    width: 0;
    height: 0;
    border-top: 12px solid transparent;
    border-left: 8px solid #38b000;
    border-bottom: 12px solid transparent;
  }
`

const BoxAbs = styled.span`
  position: absolute;
  top: -1em;
  left: -2em;
`

const BoxPad = styled.span`
  position: relative;
`

export const QuoteSticker = ({ nid }: { nid: string }) => {
  return (
    <Box id={nid}>
      <BoxAbs>
        <BoxPad>
          <Mark></Mark>
        </BoxPad>
      </BoxAbs>
    </Box>
  )
}
