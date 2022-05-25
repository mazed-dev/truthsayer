import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'

/**
 * Invisible custom element to prepend children to a given target element
 */
export const PrependSocket = ({
  target,
  children,
}: React.PropsWithChildren<{
  target: Element
}>) => {
  const element = document.createElement('mazed-quotation')
  useEffect(() => {
    target?.prepend(element)
    return () => {
      target?.removeChild(element)
    }
  })
  if (target == null) {
    return null
  }
  return ReactDOM.createPortal(<>{children}</>, element)
}
