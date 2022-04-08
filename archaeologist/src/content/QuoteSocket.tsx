import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'

/**
 * Invisible custom element to render children by given HTML path
 */
export const QuoteSocket = ({
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
