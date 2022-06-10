import React from 'react'

import { CodeBlockBox } from './components.js'

type CodeBlockQuoteProps = React.PropsWithChildren<{
  className?: string
}>

export const CodeBlock = React.forwardRef<HTMLElement, CodeBlockQuoteProps>(
  ({ className, children, ...attributes }, ref) => {
    return (
      <CodeBlockBox
        className={className}
        spellCheck={false}
        // autoComplete={'off'}
        autoCorrect={'off'}
        autoCapitalize={'off'}
        ref={ref}
        {...attributes}
      >
        {children}
      </CodeBlockBox>
    )
  }
)
