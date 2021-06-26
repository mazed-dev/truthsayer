import React from 'react'

import { useSelected, useFocused } from 'slate-react'

import { joinClasses } from '../../../util/elClass.js'

import './components.css'

import styles from './Image.module.css'

export const Image = React.forwardRef(
  ({ attributes, children, element }, ref) => {
    let { link, url } = element
    url = url || link
    let className = styles.image
    const selected = useSelected()
    const focused = useFocused()
    if (selected && focused) {
      className = joinClasses(className, styles.image_selected)
    }
    return (
      <div {...attributes}>
        <div contentEditable={false}>
          <img src={url} className={className} ref={ref} />
        </div>
        {children}
      </div>
    )
  }
)
