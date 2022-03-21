import React from 'react'

import { HorizontalRule } from './components'

type HRuleProps = React.PropsWithChildren<{}>

export const HRule = React.forwardRef<HTMLImageElement, HRuleProps>(
  ({ children, ...attributes }, ref) => {
    return (
      <div {...attributes}>
        <div contentEditable={false}>
          <HorizontalRule ref={ref} />
          {children}
        </div>
      </div>
    )
  }
)
