import React from 'react'

import { useSelected } from 'slate-react'

import { joinClasses } from '../../../util/elClass.js'

import './components.css'

import styles from './Paragraph.module.css'

import { debug } from '../../../util/log'

const lodash = require('lodash')

export const Paragraph = React.forwardRef(
  ({ className, children, ...attributes }, ref) => {
    className = joinClasses('doc_block_paragraph', className)
    const selected = useSelected()
    if (selected && children.length === 1) {
      const text = lodash.get(children[0], 'props.text.text')
      if (text === '') {
        className = joinClasses(className, styles.tip)
      }
    }
    return (
      <p ref={ref} className={className} {...attributes}>
        {children}
      </p>
    )
  }
)
