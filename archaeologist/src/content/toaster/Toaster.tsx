import React from 'react'
import ReactDOM from 'react-dom'
import styled from '@emotion/styled'
import { Box } from './../style'

const kToasterBoxElementId = 'mazed-archaeologist-toaster-id'
const ToasterBox = styled.div`
  position: fixed !important;
  top: 24px !important;
  right: 32px !important;
`
export const Toaster = ({ children }: React.PropsWithChildren<{}>) => {
  const container = document.createElement(
    'mazed-archaeologist-toaster-container'
  )
  React.useEffect(
    () => {
      const target = document.body
      target.appendChild(container)
      return () => {
        target.removeChild(container)
      }
    }
    /**
     * There is no dependency list here on purpose, otherwise content updates to
     * the container are not get through.
     */
  )
  return ReactDOM.createPortal(
    <ToasterBox id={kToasterBoxElementId}>{children}</ToasterBox>,
    container
  )
}

const ToastBox = styled(Box)`
  z-index: 99999;
`
export const Toast = ({
  children,
  id,
}: React.PropsWithChildren<{ id: string }>) => {
  const box = document.createElement('mazed-archaeologist-toast')
  React.useEffect(
    () => {
      const target = document.getElementById(kToasterBoxElementId)
      target?.appendChild(box)
      return () => {
        target?.removeChild(box)
      }
    }
    /**
     * There is no dependency list here on purpose, otherwise content updates to
     * the container are not get through.
     */
  )
  return ReactDOM.createPortal(<ToastBox key={id}>{children}</ToastBox>, box)
}
