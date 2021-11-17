import React from 'react'

import { jcss } from 'elementary'

import './components.css'

export const BlockQuote = React.forwardRef(
  ({ className, children, cite, ...attributes }, ref) => {
    className = jcss('doc_block_blockquote', className)
    return (
      <blockquote className={className} cite={cite} ref={ref} {...attributes}>
        {children}
      </blockquote>
    )
  }
)
