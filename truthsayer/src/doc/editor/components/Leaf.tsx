import React from 'react'

import styles from './Leaf.module.css'
import { RenderLeafProps } from 'slate-react'

export const Leaf = React.forwardRef<HTMLSpanElement, RenderLeafProps>(
  ({ attributes, children, leaf }, ref) => {
    if (leaf.bold) {
      children = <strong>{children}</strong>
    }
    if (leaf.code) {
      children = <code className={styles.inline_code}>{children}</code>
    }
    if (leaf.italic) {
      children = <em>{children}</em>
    }
    if (leaf.underline) {
      children = <u>{children}</u>
    }
    return <span {...attributes}>{children}</span>
  }
)
