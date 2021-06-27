import React from 'react'

import { Button } from 'react-bootstrap'

import styles from './MeatballsButton.module.css'

import EllipsisImg from './../img/ellipsis.png'

import { jcss } from '../util/jcss'

import { HoverTooltip } from '../lib/tooltip'

export const MeatballsButton = React.forwardRef(
  ({ children, onClick, className }, ref) => (
    <Button
      variant="light"
      className={jcss(styles.tool_button, className)}
      ref={ref}
      onClick={(e) => {
        e.preventDefault()
        onClick(e)
      }}
    >
      {children}
      <HoverTooltip tooltip={'More'}>
        <img
          src={EllipsisImg}
          className={styles.tool_button_img}
          alt={'More'}
        />
      </HoverTooltip>
    </Button>
  )
)
