import React from 'react'

import styles from './CheckBox.module.css'

import { jcss } from 'elementary'

type CheckBoxProps = {
  className?: string
  checked: boolean
  disabled: boolean
  onChange: React.MouseEventHandler
}

export const CheckBox = React.forwardRef<HTMLDivElement, CheckBoxProps>(
  ({ checked, onChange, className, disabled, ...kwargs }, ref) => {
    const tick = checked ? styles.checkmark : undefined
    let pointy = styles.pointy
    return (
      <div
        className={jcss(
          styles.container,
          disabled ? pointy : undefined,
          className
        )}
        onClick={disabled ? onChange : undefined}
        ref={ref}
        {...kwargs}
      >
        <div className={jcss(styles.checkbox, tick)} />
      </div>
    )
  }
)

export default CheckBox
