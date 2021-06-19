import React from 'react'

import './components.css'

import { joinClasses } from '../../../util/elClass.js'

export const HRule = React.forwardRef(
  ({ className, children, ...args }, ref) => {
    if (className) {
      className = joinClasses(className, 'doc_block_hrule')
    } else {
      className = 'doc_block_hrule'
    }
    return (
      <span className={className} ref={ref} {...args}>
        {children}
      </span>
    )
  }
)
