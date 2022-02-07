import React from 'react'

import './components.css'

export const HRule = React.forwardRef(({ attributes, children }, ref) => {
  const className = 'doc_block_hrule'
  return (
    <div {...attributes}>
      <div contentEditable={false}>
        <div ref={ref} className={className} />
        {children}
      </div>
    </div>
  )
})
