import React from 'react'

import { useSelected } from 'slate-react'

import { jcss } from 'elementary'

import './components.css'

import styles from './Paragraph.module.css'

import lodash from 'lodash'

type ParagraphProps = React.PropsWithChildren<{
  className: string
}>

export const Paragraph = React.forwardRef<HTMLParagraphElement, ParagraphProps>(
  ({ className, children, ...attributes }, ref) => {
    className = jcss('doc_block_paragraph', className)
    const selected = useSelected()
    // @ts-ignore: Property 'length' does not exist on type 'ReactNode'
    if (selected && children?.length === 1) {
      // @ts-ignore: expression of type '0' can't be used to index type 'ReactNode'
      const text = lodash.get(children[0], 'props.text.text')
      if (text === '') {
        className = jcss(className, styles.tip)
      }
    }
    return (
      <p ref={ref} className={className} {...attributes}>
        {children}
      </p>
    )
  }
)
