import React from 'react'

import { jcss } from 'elementary'

// Internal
import styles from './WideCard.module.css'

export class WideCard extends React.Component {
  render() {
    return (
      <div
        className={jcss(
          styles.fluid_container,
          styles.wide_card,
          this.props.className
        )}
        ref={this.props.cardRef}
      >
        {this.props.children}
      </div>
    )
  }
}

WideCard.defaultProps = { className: null }

export default WideCard
