import React from 'react'

import { jcss } from './../util/jcss'

import styles from './vanishing.module.css'

export class Vanishing extends React.Component {
  componentDidUpdate(prevProps) {
    if (this.props !== prevProps) {
      // ?
    }
  }
  render() {
    return (
      <div className={jcss(this.props.className, styles.vanishing)}>
        {this.props.children}
      </div>
    )
  }
}
