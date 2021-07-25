import React from 'react'

import './tooltip.css'

import { jcss } from './../util/jcss'

// https://www.w3schools.com/css/css_tooltip.asp
export const HoverTooltip = React.forwardRef(({ tooltip, children }, ref) => {
  return (
    <div className={'mzd-tooltip-root'} ref={ref}>
      <span className={'mzd-tooltip-plate'}>{tooltip}</span>
      {children}
    </div>
  )
})
