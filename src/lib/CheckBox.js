import React from 'react'

import styles from './CheckBox.module.css'

import { joinClasses } from '../util/elClass.js'

export const CheckBox = React.forwardRef(
  ({ checked, onChange, className, disabled, ...kwargs }, ref) => {
    const tick = checked ? styles.checkmark : null
    let pointy = styles.pointy
    if (disabled) {
      onChange = null
      pointy = null
    }
    return (
      <div
        className={joinClasses(styles.container, pointy, className)}
        onClick={onChange}
        ref={ref}
        {...kwargs}
      >
        <div className={joinClasses(styles.checkbox, tick)} />
      </div>
    )
  }
)

export default CheckBox
