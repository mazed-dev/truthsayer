import React from 'react'

import { Badge } from 'react-bootstrap'

import moment from 'moment'

import { joinClasses } from '../../../util/elClass.js'
import { Optional } from '../../../util/types'
import { debug } from '../../../util/log'

import './components.css'

export const Link = React.forwardRef(
  ({ attributes, children, element }, ref) => {
    const { link } = element
    const className = joinClasses(
      'doc_block_inline_link',
      'doc_block_inline_link_ext'
    )
    return (
      <a ref={ref} href={link} {...attributes} className={className}>
        {children}
      </a>
    )
  }
)
