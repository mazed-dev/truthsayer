import React from 'react'

import './components.css'

import { jcss } from '../../../util/jcss'
import { debug } from '../../../util/log'

export const HRule = React.forwardRef(
  ({ attributes, children, element }, ref) => {
    const className = 'doc_block_hrule'
    return (
      <div {...attributes}>
        <div contentEditable={false}>
          <div ref={ref} className={className} />
          {children}
        </div>
      </div>
    )
  }
)
