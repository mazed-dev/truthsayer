import React from 'react'
import { Link as ReactRouterLink } from 'react-router-dom'
import { jcss } from 'elementary'

import './components.css'

type LinkProps = React.PropsWithChildren<{
  attributes: any
  element: any
}>

export const Link = React.forwardRef<HTMLLinkElement, LinkProps>(
  ({ attributes, children, element }, ref) => {
    let { link, url, page } = element
    url = url || link
    let className = 'doc_block_inline_link'

    if (page) {
      className = jcss(className, 'doc_block_inline_link_page')
      url = `/n/${url}`
      return (
        <ReactRouterLink
          to={url}
          ref={ref}
          className={className}
          {...attributes}
        >
          {children}
        </ReactRouterLink>
      )
    }
    className = jcss(className, 'doc_block_inline_link_ext')
    return (
      <a ref={ref} href={url} className={className} {...attributes}>
        {children}
      </a>
    )
  }
)
