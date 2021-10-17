import React from 'react'

import styles from './CheckBox.module.css'

import { jcss } from '../util/jcss'

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
        className={jcss(styles.container, pointy, className)}
        onClick={onChange}
        ref={ref}
        {...kwargs}
      >
        <div className={jcss(styles.checkbox, tick)} />
      </div>
    )
  }
)

export default CheckBox
