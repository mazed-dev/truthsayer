import React from 'react'

import { joinClasses } from '../../../util/elClass.js'

import './components.css'

export const CodeBlock = React.forwardRef(
  ({ className, children, ...attributes }, ref) => {
    className = joinClasses('doc_code_block', className)
    return (
      <code
        className={className}
        spellCheck={false}
        autoComplete={'off'}
        autoCorrect={'off'}
        autoCapitalize={'off'}
        {...attributes}
      >
        {children}
      </code>
    )
  }
)
