import React from 'react'
import { ImgButton, reactNodeToString } from 'elementary'
import { ContentContext } from '../context'

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
      text: reactNodeToString(children),
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
