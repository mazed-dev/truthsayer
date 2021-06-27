import React from 'react'

import './tooltip.css'
import styles from './tooltip.module.css'

import { jcss } from './../util/jcss'

// https://www.w3schools.com/css/css_tooltip.asp

export class HoverTooltip extends React.Component {
  render() {
    return (
      <div className={jcss('mzd-tooltip-root', styles.tooltip_root)}>
        <span className={jcss('mzd-tooltip-plate', styles.tooltip_plate)}>
          {this.props.tooltip}
        </span>
        {this.props.children}
      </div>
    )
  }
}
