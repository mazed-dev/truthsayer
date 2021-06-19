import React from 'react'

import { joinClasses } from '../../../util/elClass.js'

import './components.css'

export const Paragraph = React.forwardRef(
  ({ className, children, ...attributes }, ref) => {
    className = joinClasses('doc_block_paragraph', className)
    return (
      <p ref={ref} className={className} {...attributes}>
        {children}
      </p>
    )
  }
)
