import React from "react";

import { joinClasses } from "./../util/elClass.js";

import styles from "./vanishing.module.css";

export class Vanishing extends React.Component {
  componentDidUpdate(prevProps) {
    if (this.props !== prevProps) {
      // ?
    }
  }
  render() {
    return (
      <div className={joinClasses(this.props.className, styles.vanishing)}>
        {this.props.children}
      </div>
    );
  }
}
