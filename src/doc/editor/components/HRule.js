import React from 'react'

import './components.css'

import { joinClasses } from '../../../util/elClass.js'

export const HRule = React.forwardRef(
  ({ className, children, ...attributes }, ref) => {
    if (className) {
      className = joinClasses(className, 'doc_block_hrule')
    } else {
      className = 'doc_block_hrule'
    }
    return (
      <div {...attributes} ref={ref}>
        <div contentEditable={false}>
          <div className={className} />
        </div>
        {children}
      </div>
    )
  }
)
