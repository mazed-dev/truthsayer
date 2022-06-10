import React from 'react'

import { InlineLinkExt, InlineLinkNode } from './components.js'

type LinkProps = React.PropsWithChildren<{
  attributes: any
  element: any
}>

export const Link = React.forwardRef<HTMLLinkElement, LinkProps>(
  ({ attributes, children, element }, ref) => {
    let { link, url, page } = element
    url = url || link

    if (page) {
      url = `/n/${url}`
      return (
        <InlineLinkNode to={url} ref={ref} {...attributes}>
          {children}
        </InlineLinkNode>
      )
    }
    return (
      <InlineLinkExt ref={ref} href={url} {...attributes}>
        {children}
      </InlineLinkExt>
    )
  }
)
