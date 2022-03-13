import React from 'react'

import { InlineCodeBox } from './components'
import { RenderLeafProps } from 'slate-react'

export const Leaf = React.forwardRef<HTMLSpanElement, RenderLeafProps>(
  ({ attributes, children, leaf }, ref) => {
    if (leaf.bold) {
      children = <strong ref={ref}>{children}</strong>
    }
    if (leaf.code) {
      children = <InlineCodeBox ref={ref}>{children}</InlineCodeBox>
    }
    if (leaf.italic) {
      children = <em ref={ref}>{children}</em>
    }
    if (leaf.underline) {
      children = <u ref={ref}>{children}</u>
    }
    return (
      <span {...attributes} ref={ref}>
        {children}
      </span>
    )
  }
)
