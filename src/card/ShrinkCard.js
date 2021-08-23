import React, { useState, useCallback, useMemo, useEffect } from 'react'

import styles from './ShrinkCard.module.css'

import { Link } from 'react-router-dom'

import { jcss } from './../util/jcss'
import { makeRefTo } from './../lib/route'

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

const SeeMoreButton = React.forwardRef(
  ({ onClick, className, disabled, on }, ref) => {
    return (
      <div
        className={jcss(styles.a_see_more, className)}
        ref={ref}
        onClick={onClick}
        disabled={disabled}
      >
        {on ? '...see less' : 'See more...'}
      </div>
    )
  }
)
export const ShrinkCard = ({ children, nid }) => {
  const [opened, setOpened] = useState(false)
  const shrinkStyle = opened ? styles.everything_xxs : styles.card_xxs
  const toggleMoreLess = () => setOpened(!opened)
  return (
    <>
      <div className={jcss(styles.shrinkable, shrinkStyle)}>
        {children}
        <div className={styles.fade} />
      </div>
      <SeeMoreButton onClick={toggleMoreLess} on={opened} />
      <Link to={makeRefTo.node(nid)} className={styles.a_see_more}>
        Open
      </Link>
    </>
  )
}
