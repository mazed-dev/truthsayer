import React from 'react'
import ReactDOM from 'react-dom'

import styled from '@emotion/styled'

const ToastBox = styled.div`
`
export const Toast = ({}:{}) => {
  return <ToastBox></ToastBox>
}

const ToasterPortal = ({ }: { }) => {
  const box = document.createElement('mazed-toaster-box')
  React.useEffect(() => {
    const target = document.body
    target.appendChild(box)
    return () => {
      target.removeChild(box)
    }
  })
  return ReactDOM.createPortal(<ToasterImpl />, box)
}

export type ToastContextProps = {
  toasts: React.ReactElement[],
}

export const ToastContext = React.createContext<ToastContextProps>({
  toasts: [],
})

const ToasterBox = styled.div`
  position: fixed;
  top: 32px;
  right: 32px;
`
const ToasterImpl = () => {
  return <ToasterBox></ToasterBox>
}

export const Toaster = React.createContext<ToastContextProps>({
