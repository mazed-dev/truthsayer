import React from 'react'

import { jcss } from './../util/jcss'

import styles from './loader_ellipsis.module.css'

export class Loader extends React.Component {
  render() {
    return (
      <div className={styles.loader}>
        <div />
        <div />
        <div />
        <div />
      </div>
    )
  }
}
