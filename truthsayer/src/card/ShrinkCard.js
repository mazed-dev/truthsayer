import React, { useState, useCallback, useMemo, useEffect } from 'react'

import styles from './ShrinkCard.module.css'

import { jcss } from './../util/jcss'
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

export const XxsCard = React.forwardRef(({ children }, ref) => {
  return (
    <div className={jcss(styles.card_xxs, styles.shrinkable)}>
      {children}
      <div className={styles.fade} />
    </div>
  )
})

export const XsCard = React.forwardRef(({ children }, ref) => {
  return (
    <div className={jcss(styles.card_xs, styles.shrinkable)}>
      {children}
      <div className={styles.fade} />
    </div>
  )
})

export const SCard = React.forwardRef(({ children }, ref) => {
  return (
    <div className={jcss(styles.card_s, styles.shrinkable)}>
      {children}
      <div className={styles.fade} />
    </div>
  )
})

export const ShrinkCard = ({ children, showMore }) => {
  const shrinkStyle = showMore ? styles.everything_xxs : styles.card_xxs
  return (
    <div className={jcss(styles.shrinkable, shrinkStyle)}>
      {children}
      <div className={styles.fade} />
    </div>
  )
}
