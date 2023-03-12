import React from 'react'
import { ImgButton, reactNodeToString } from 'elementary'
import { ContentContext } from '../context'

type Props = React.PropsWithChildren<{
  onClick?: React.MouseEventHandler
  className?: string
  href?: string
  metricLabel?: string
}>

export const MeteredButton = React.forwardRef<HTMLButtonElement, Props>(
  ({ onClick, children, className, href, metricLabel, ...props }, ref) => {
    const ctx = React.useContext(ContentContext)
    const onMeteredClick = (event: React.MouseEvent) => {
      ctx.analytics?.capture(`Button:Click ${metricLabel}`, {
        text: reactNodeToString(children),
        'Event type': 'click',
        className,
      })
      if (onClick != null) {
        onClick(event)
      } else if (href != null) {
        window.location.href = href
      }
    }
    return (
      <ImgButton
        href={href}
        onClick={onMeteredClick}
        className={className}
        ref={ref}
        {...props}
      >
        {children}
      </ImgButton>
    )
  }
)
