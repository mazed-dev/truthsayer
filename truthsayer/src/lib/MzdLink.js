import React from 'react'

import { Link } from 'react-router-dom'

import { jcss } from '../util/jcss'

import styles from './MzdLink.module.css'

export function MzdLink({
  to,
  className,
  children,
  is_note,
  is_external,
  ...rest
}) {
  let prefix = null
  if (is_note) {
    prefix = '/'
  } else if (is_external) {
    prefix = '\uD83C\uDF0D ' // "\uD83C\uDF10 ";
    return (
      <a href={to} className={jcss(className, styles.inline_link)} {...rest}>
        {prefix}
        {children}
      </a>
    )
  }
  return (
    <Link to={to} className={jcss(className, styles.inline_link)} {...rest}>
      {prefix}
      {children}
    </Link>
  )
}
