import React from 'react'

import { joinClasses } from './../util/elClass.js'

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
