import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'

/**
 * Invisible custom element to render children by given HTML path
 */
export const QuoteSocket = ({
  target,
  children,
}: React.PropsWithChildren<{ target: Element }>) => {
  const element = document.createElement('mazed-quotation')
  useEffect(() => {
    target.prepend(element)
    return () => {
      target.removeChild(element)
    }
  })
  return ReactDOM.createPortal(children, element)
}
