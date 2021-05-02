import React from "react";

import PropTypes from "prop-types";
import { withRouter, Link } from "react-router-dom";

import axios from "axios";
import moment from "moment";

import { Card } from "react-bootstrap";

import { smugler } from "./../smugler/api";
import { ReadOnlyRender } from "./../doc/ReadOnlyRender";
import { joinClasses } from "./../util/elClass.js";
import { Loader } from "./../lib/loader";
import { MzdGlobalContext } from "./../lib/global.js";

import { XsCard } from "./ShrinkCard";

import LockedImg from "./../img/locked.png";

import styles from "./SmallCard.module.css";

function getShadowStyle(n) {
  switch (Math.max(0, n) /* treat negative numbers as 0 */) {
    case 0:
      return styles.small_card_shadow_0;
    case 1:
      return styles.small_card_shadow_1;
    case 2:
      return styles.small_card_shadow_2;
    case 3:
      return styles.small_card_shadow_3;
    case 4:
      return styles.small_card_shadow_4;
    default:
      break;
  }
  return styles.small_card_shadow_5;
}

export class SmallCard extends React.Component {
  render() {
    let clickableOnClick = null;
    let clickableStyle = null;
    if (this.props.onClick) {
      clickableStyle = styles.clickable_chunks;
      clickableOnClick = this.props.onClick;
    }
    const shadowStyle = getShadowStyle(this.props.stack_size);
    return (
      <div
        className={joinClasses(
          styles.small_card,
          clickableStyle,
          shadowStyle,
          this.props.className
        )}
        ref={this.props.cardRef}
        onClick={clickableOnClick}
      >
        {this.props.children}
      </div>
    );
  }
}

SmallCard.defaultProps = { onClick: null, className: null, stack_size: 0 };

export default SmallCard;
