import React from "react";
import PropTypes from "prop-types";

import styles from "./CheckBox.module.css";

import Emoji from "./../Emoji";

import { joinClasses } from "../util/elClass.js";

export class CheckBox extends React.Component {
  constructor(props) {
    super(props);
  }

  onClick = () => {
    console.log("Source position -> ", this.props.sourcePosition);
  };

  render() {
    const checkmark = this.props.is_checked ? (
      <Emoji symbol={"✅"} label="checked" />
    ) : (
      <div className={styles.checkbox} />
    );
    return (
      <div
        className={joinClasses(styles.container, this.props.className)}
        onClick={this.onClick}
      >
        {checkmark}
      </div>
    );
  }
}

export default CheckBox;
