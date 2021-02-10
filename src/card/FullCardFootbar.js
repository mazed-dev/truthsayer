import React from "react";

import { Link, withRouter } from "react-router-dom";
import {
  Button,
  Container,
  Form,
  ButtonToolbar,
  ButtonGroup,
  DropdownButton,
  Dropdown,
} from "react-bootstrap";

import PropTypes from "prop-types";

import { smugler } from "./../smugler/api";

import styles from "./FullCardFootbar.module.css";

import NextNewLeftImg from "./../full_node_view/img/next-link-new-left.png";
import NextNewRightImg from "./../full_node_view/img/next-link-new-right.png";
import DownloadButtonImg from "./../img/download.png";

import { HoverTooltip } from "./../lib/tooltip";
import { joinClasses } from "./../util/elClass.js";

export class FullCardFootbar extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    //<ButtonGroup className={joinClasses(styles.toolbar_group)}>
    // </ButtonGroup >
    return (
      <ButtonToolbar className={joinClasses(styles.toolbar)}>
        <Button
          variant="light"
          onClick={this.handleNextClick}
          className={styles.tool_button}
        >
          <HoverTooltip tooltip={"Create and link"}>
            <img
              src={NextNewLeftImg}
              className={styles.tool_button_img}
              alt="Add left link"
            />
          </HoverTooltip>
        </Button>
        <DropdownButton as={ButtonGroup} title="" >
          <Dropdown.Item eventKey="1">Dropdown link</Dropdown.Item>
        </DropdownButton>
        <Button
          variant="light"
          className={styles.tool_button}
          onClick={this.copyDocAsMarkdown}
        >
          <HoverTooltip tooltip={"Copy as markdown text"}>
            <img
              src={DownloadButtonImg}
              className={styles.tool_button_img}
              alt={"Copy as markdown text"}
            />
          </HoverTooltip>
        </Button>
        <Button
          variant="light"
          className={styles.tool_button}
          onClick={this.copyDocAsMarkdown}
        >
          <HoverTooltip tooltip={"To archive"}>
            <img
              src={DownloadButtonImg}
              className={styles.tool_button_img}
              alt={"To archive"}
            />
          </HoverTooltip>
        </Button>
        <DropdownButton as={ButtonGroup} title="" >
          <Dropdown.Item eventKey="1">Dropdown link</Dropdown.Item>
        </DropdownButton>
        <Button
          variant="light"
          onClick={this.handleNextClick}
          className={styles.tool_button}
        >
          <HoverTooltip tooltip={"Create and link"}>
            <img
              src={NextNewRightImg}
              className={styles.tool_button_img}
              alt="Add right link"
            />
          </HoverTooltip>
        </Button>
      </ButtonToolbar>
    );
  }
}

export default FullCardFootbar;
