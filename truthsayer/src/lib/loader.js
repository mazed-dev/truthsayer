import React from 'react'

import { jcss } from 'elementary'

import styles from './loader.module.css'

export class Loader extends React.Component {
  render() {
    let sizeStyle = null
    if (this.props.size == null || this.props.size === 'large') {
      sizeStyle = styles.large
    } else if (this.props.size === 'medium') {
      sizeStyle = styles.medium
    } else if (this.props.size === 'small') {
      sizeStyle = styles.small
    }
    return (
      <div className={jcss(styles.roller, sizeStyle)}>
        <div />
        <div />
        <div />
        <div />
        <div />
        <div />
        <div />
        <div />
      </div>
    )
  }
}

Loader.defaultProps = { size: null }
