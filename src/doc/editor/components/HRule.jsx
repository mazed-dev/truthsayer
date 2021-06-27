import React from 'react'

import './components.css'

import { jcss } from '../../../util/jcss'

export const HRule = React.forwardRef(
  ({ className, children, ...attributes }, ref) => {
    if (className) {
      className = jcss(className, 'doc_block_hrule')
    } else {
      className = 'doc_block_hrule'
    }
    return (
      <div {...attributes} ref={ref}>
        <div contentEditable={false} className={className} />
      </div>
    )
  }
)
