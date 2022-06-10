import React from 'react'
import { BlockQuoteBox, BlockQuotePad } from './components.js'

type BlockQuoteProps = React.PropsWithChildren<{
  className?: string
  cite: string
}>

export const BlockQuote = React.forwardRef<HTMLQuoteElement, BlockQuoteProps>(
  ({ className, children, cite }, ref) => {
    return (
      <BlockQuoteBox className={className}>
        <BlockQuotePad ref={ref} cite={cite}>
          {children}
        </BlockQuotePad>
      </BlockQuoteBox>
    )
  }
)
