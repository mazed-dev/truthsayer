import React from "react";

import "./tooltip.css";
import styles from "./tooltip.module.css";

import { joinClasses } from "./../util/elClass.js";

// https://www.w3schools.com/css/css_tooltip.asp

export class HoverTooltip extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className={joinClasses("mzd-tooltip-root", styles.tooltip_root)}>
        <span
          className={joinClasses("mzd-tooltip-plate", styles.tooltip_plate)}
        >
          {this.props.tooltip}
        </span>
        {this.props.children}
      </div>
    );
  }
}
