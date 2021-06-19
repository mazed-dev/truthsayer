import React from 'react'

import { joinClasses } from '../../../util/elClass.js'

import './components.css'

export const BlockQuote = React.forwardRef(
  ({ className, children, cite, ...attributes }, ref) => {
    className = joinClasses('doc_block_blockquote', className)
    return (
      <blockquote className={className} cite={cite} {...attributes}>
        {children}
      </blockquote>
    )
  }
)
