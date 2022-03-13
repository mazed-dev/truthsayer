import React from 'react'

import { HorizontalRule } from './components'

export const HRule = React.forwardRef(({ attributes, children }, ref) => {
  return (
    <div {...attributes}>
      <div contentEditable={false}>
        <HorizontalRule ref={ref} />
        {children}
      </div>
    </div>
  )
})
