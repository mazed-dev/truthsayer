import React from 'react'

import { InlineLink } from './components'

type LinkProps = React.PropsWithChildren<{
  attributes: any
  element: any
}>

export const Link = React.forwardRef<HTMLLinkElement, LinkProps>(
  ({ attributes, children, element }, ref) => {
    let { link, url, page } = element
    url = url ?? link
    if (page) {
      url = `/n/${url}`
    }
    return (
      <InlineLink ref={ref} href={url} {...attributes} spellCheck={false}>
        {children}
      </InlineLink>
    )
  }
)
