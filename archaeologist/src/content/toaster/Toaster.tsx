import React from 'react'
import ReactDOM from 'react-dom'

import styled from '@emotion/styled'

const ToastBox = styled.div`
`
export const Toast = ({}:{}) => {
  return <ToastBox></ToastBox>
}

const ToasterBox = styled.div`
  position: fixed;
  top: 32px;
  right: 32px;
`
const ToasterPortal = ({ children }: React.PropsWithChildren<{}>) => {
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

export type ToastContextProps = {
  upsert: (toast: React.ReactElement, key_?: string) => string,
  delete: (key: string) => void,
}

export const ToastContext = React.createContext<ToastContextProps>({
  upsert: (_toast: React.ReactElement, _key?: string) => {
    throw new Error()
  },
  delete: (_key: string) => {
    throw new Error()
  },
})

type ToasterProps = React.PropsWithChildren<{}>

type ToastsMap = {
   [key: string]: React.ReactElement
}

export const Toaster = ({children} : ToasterProps) => {
  const [toasts, setToasts] = React.useState<ToastsMap>({})
  const upsert =  (toast: React.ReactElement, key_?: string) => {
    const key = key_ ?? `-${Math.random()}`
    console.log('Upsert', toast, key_, key)
    setToasts((m) => {
      console.log('Upsert.setToasts', toast, key)
      m[key] = toast
      console.log('Upsert.setToasts: locally inserted', toast, key)
      return m
    })
    return key
  }
  const delete_ = (key: string) => {
    setToasts((m) => {
      delete m[key]
      return m
    })
  }
  console.log('Toasts', toasts, Object.values(toasts))
  return (
    <ToastContext.Provider value={{ upsert, delete: delete_}} >
      <ToasterPortal>{Object.values(toasts)}</ToasterPortal>
      {children}
    </ToastContext.Provider>
  )
}
