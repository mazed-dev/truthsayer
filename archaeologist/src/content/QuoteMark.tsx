import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'

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
`

const Mark = styled.span`
  position: absolute;
  top: -1em;
  left: -2em;

  cursor: pointer !important;

  background: #ffffff !important;
  color: #5c5c5c !important;
  font-size: 14px !important;
  text-align: center !important;
  width: 22px !important;
  height: 22px !important;
  line-height: 20px !important;
  border-radius: 12px !important;
  border: #e0e0e0 solid 1px !important;

  opacity: 0.6;
  &:hover {
    opacity: 1;
  }
}
`

export const QuoteHint = ({}:{}) => {
  return <Box><Mark>&#62;</Mark></Box>
}


export const QuoteMark = ({
  path,
  children,
}: React.PropsWithChildren<{ path: string }>) => {
  const element = document.createElement('mazed-quotation')
  const target = document.querySelector(path)
  useEffect(() => {
    target?.prepend(element)
    return () => {
      target?.removeChild(element)
    }
  })
  return ReactDOM.createPortal(children, element)
}
