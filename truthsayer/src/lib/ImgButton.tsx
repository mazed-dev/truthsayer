import React from 'react'

import { Button } from 'react-bootstrap'

import { jcss } from '../util/jcss'

import styles from './ImgButton.module.css'

type ImgButtonProps = React.PropsWithChildren<{
  onClick: React.MouseEventHandler
  className: string
  is_disabled: boolean
}>

export const ImgButton = React.forwardRef<HTMLButtonElement, ImgButtonProps>(
  ({ children, onClick, className, is_disabled, ...kwargs }, ref) => (
    <Button
      variant="light"
      className={jcss(styles.img_button, className)}
      ref={ref}
      disabled={is_disabled}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault()
          onClick(e)
        }
      }}
      {...kwargs}
    >
      {children}
    </Button>
  )
)
