import React from "react";

import styles from "./ControlButton.module.css";

import { joinClasses } from "../../util/elClass.js";

export class ControlButton extends React.Component {
  constructor() {
    super();
    this.onToggle = (e) => {
      e.preventDefault();
      this.props.onToggle(this.props.style);
    };
  }
  render() {
    // Custom overrides for "code" style.
    let { active, children, className } = this.props;
    if (active) {
      className = joinClasses(className, styles.btn, styles.btn_active);
    } else {
      className = joinClasses(className, styles.btn);
    }
    return (
      <div className={className} onMouseDown={this.onToggle}>
        {children}
      </div>
    );
  }
}
