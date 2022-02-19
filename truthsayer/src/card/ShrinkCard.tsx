import React from 'react'

import styles from './ShrinkCard.module.css'

import { jcss } from 'elementary'
/**
 * +-------------------+
 * | Card outstyle     |
 * |+-----------------+|
 * || ShrinkCard      ||
 * ||+---------------+||
 * ||| Document card |||
 * |||               |||
 * ||+---------------+||
 * |+-----------------+|
 * +-------------------+
 */

type SCardProps = React.PropsWithChildren<{}>

export const SCard = ({ children }: SCardProps) => {
  return (
    <div className={jcss(styles.card_s, styles.shrinkable)}>
      {children}
      <div className={styles.fade} />
    </div>
  )
}

type ShrinkCardProps = React.PropsWithChildren<{
  showMore?: boolean
}>

export const ShrinkCard = ({ children, showMore }: ShrinkCardProps) => {
  const shrinkStyle = showMore ? styles.everything_s : styles.card_s
  return (
    <div className={jcss(styles.shrinkable, shrinkStyle)}>
      {children}
      <div className={styles.fade} />
    </div>
  )
}
