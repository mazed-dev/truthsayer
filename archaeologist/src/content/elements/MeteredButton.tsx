import React from 'react'
import { ImgButton } from 'elementary'
import { ContentContext } from '../context'

const getTextFromChildren = (children: React.ReactNode) => {
  let label = ''
  React.Children.forEach(children, (child) => {
    if (typeof child === 'string') {
      label += child
    } else if (typeof child === 'number') {
      label += child.toString()
    } else if (React.isValidElement(child)) {
      label += getTextFromChildren(child.props.children)
    }
  })
  return label
}

export function MeteredButton({
  onClick,
  children,
  className,
  href,
  metricLabel,
}: React.PropsWithChildren<{
  onClick?: React.MouseEventHandler
  className?: string
  href?: string
  metricLabel?: string
}>) {
  const ctx = React.useContext(ContentContext)
  const onMeteredClick = (event: React.MouseEvent) => {
    ctx.analytics?.capture(`Button:Click ${metricLabel}`, {
      text: getTextFromChildren(children),
      event_type: 'click',
      className,
    })
    if (onClick != null) {
      onClick(event)
    } else if (href != null) {
      window.location.href = href
    }
  }
  return (
    <ImgButton href={href} onClick={onMeteredClick} className={className}>
      {children}
    </ImgButton>
  )
}
