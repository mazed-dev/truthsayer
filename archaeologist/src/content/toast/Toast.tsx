import React from 'react'
import ReactDOM from 'react-dom'

export const Toast = ({ }: { }) => {
  const box = document.createElement('mazed-toast-box')
  React.useEffect(() => {
    const target = document.body
    target.appendChild(box)
    return () => {
      target.removeChild(box)
    }
  })
  return ReactDOM.createPortal(<ToastImpl />, box)
}

export type ToastContextProps = {
}

export const ToastContext = React.createContext<ToastContextProps>({
  toasts: [],
  push: ({ title: string, message }) => {
    // *dbg*/ console.log('Default push() function called: ', header, message)
  },
})

const ToastImpl = ({}: {}) => {
  return <></>
}
