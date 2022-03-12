import React from 'react'
import { Blockquote } from  './components'

type BlockQuoteProps = React.PropsWithChildren<{
  className?: string
  cite: string
}>

export const BlockQuote = React.forwardRef<HTMLQuoteElement, BlockQuoteProps>(
  ({ className, children, cite, ...attributes }, ref) => {
    console.log('Blockquote' , Blockquote)
    return (
      <Blockquote cite={cite} ref={ref} {...attributes}>
        {children}
      </Blockquote>
    )
  }
)
