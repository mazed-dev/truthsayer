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

export function WatchedButton({
  onClick,
  children,
  className,
  href,
  watchedLabel,
}: React.PropsWithChildren<{
  onClick?: React.MouseEventHandler
  className?: string
  href?: string
  watchedLabel?: string
}>) {
  const ctx = React.useContext(ContentContext)
  const onWatchedClick = (event: React.MouseEvent) => {
    ctx.analytics?.capture(`Button:Click ${watchedLabel}`, {
      text: getTextFromChildren(children),
      event_type: 'click',
      className,
    })
    if (onClick != null) {
      onClick(event)
    }
  }
  return (
    <ImgButton href={href} onClick={onWatchedClick} className={className}>
      {children}
    </ImgButton>
  )
}
