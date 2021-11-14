import React from 'react'

import { jcss } from 'elementary'

import './components.css'

export const CodeBlock = React.forwardRef(
  ({ className, children, ...attributes }, ref) => {
    className = jcss('doc_code_block', className)
    return (
      <code
        className={className}
        spellCheck={false}
        autoComplete={'off'}
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
