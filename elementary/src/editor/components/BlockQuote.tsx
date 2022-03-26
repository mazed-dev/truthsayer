import React from 'react'
import { BlockquoteBox } from './components'

type BlockQuoteProps = React.PropsWithChildren<{
  className?: string
  cite: string
}>

export const BlockQuote = React.forwardRef<HTMLQuoteElement, BlockQuoteProps>(
  ({ className, children, cite, ...attributes }, ref) => {
    return (
      <BlockquoteBox
        cite={cite}
        className={className}
        ref={ref}
        {...attributes}
      >
        {children}
      </BlockquoteBox>
    )
  }
)
