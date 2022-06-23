import React from 'react'
import ReactDOM from 'react-dom'
import styled from '@emotion/styled'
import { Box } from './../quote/QuoteToolbar'

const ToastBox = styled(Box)``
export const Toast = ({ children }: React.PropsWithChildren<{}>) => {
  return <ToastBox>{children}</ToastBox>
}

const ToasterBox = styled.div`
  position: fixed;
  top: 32px;
  right: 32px;
`
export const ToasterPorta = ({ children }: React.PropsWithChildren<{}>) => {
  const box = document.createElement('mazed-toaster-box')
  React.useEffect(() => {
    const target = document.body
    target.appendChild(box)
    return () => {
      target.removeChild(box)
    }
  })
  return ReactDOM.createPortal(<ToasterBox>{children}</ToasterBox>, box)
}
