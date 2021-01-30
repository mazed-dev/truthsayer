import React from "react";

import styles from "./tooltip.module.css";

// https://www.w3schools.com/css/css_tooltip.asp

class BlackTooltipHover extends React {
  constructor(props) {
    super(props);
    this.state = {
      hover: false,
    };
  }

  onHover = () => {
    this.setState({ hover: true });
  };

  offHover = () => {
    this.setState({ hover: false });
  };

  render() {
    <div
      className={joinClasses(styles.fluid_container)}
      onMouseEnter={this.onHover}
      onMouseLeave={this.offHover}
    >
      <span class="tooltiptext">Tooltip text</span>
      {this.props.children}
    </div>;
  }
}
