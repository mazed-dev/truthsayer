import React from 'react'

import { jcss } from 'elementary'

import './components.css'

type CodeBlockQuoteProps = React.PropsWithChildren<{
  className: string
}>

export const CodeBlock = React.forwardRef<HTMLElement, CodeBlockQuoteProps>(
  ({ className, children, ...attributes }, ref) => {
    className = jcss('doc_code_block', className)
    return (
      <code
        className={className}
        spellCheck={false}
        // autoComplete={'off'}
        autoCorrect={'off'}
        autoCapitalize={'off'}
        ref={ref}
        {...attributes}
      >
        {children}
      </code>
    )
  }
)
