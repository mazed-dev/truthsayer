import React from "react";

import { Link, withRouter } from "react-router-dom";
import {
  Button,
  Container,
  Form,
  ButtonToolbar,
  ButtonGroup,
} from "react-bootstrap";

import PropTypes from "prop-types";

import { smugler } from "./smugler/api";

import styles from "./Toolbar.module.css";

import NextNewLeftImg from "./../full_node_view/img/next-link-new-left.png";
import NextNewRightImg from "./../full_node_view/img/next-link-new-right.png";

class FullCardFootbar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    <ButtonToolbar className={joinClasses(styles.toolbar)}>
      <ButtonGroup className={joinClasses(styles.toolbar_group)}>
        <Button
          variant="light"
          onClick={this.handleNextClick}
          className={styles.tool_button}
        >
          <HoverTooltip tooltip={"Create and link"}>
            <img
              src={NextNewLeftImg}
              className={styles.tool_button_img}
              alt="Create and link"
            />
          </HoverTooltip>
        </Button>
        <Button
          variant="light"
          onClick={this.handleNextClick}
          className={styles.tool_button}
        >
          <HoverTooltip tooltip={"Create and link"}>
            <img
              src={NextNewRightImg}
              className={styles.tool_button_img}
              alt="Create and link"
            />
          </HoverTooltip>
        </Button>
      </ButtonGroup>
    </ButtonToolbar>;
  }
}
