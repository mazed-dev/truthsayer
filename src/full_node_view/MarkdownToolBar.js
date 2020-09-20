import React from "react";

import styles from "./ToolBars.module.css";

import NextNewLeftImg from "./img/next-link-new-left.svg";
import NextSearchLeftImg from "./img/next-link-search-left.svg";

import NextNewRightImg from "./img/next-link-new-right.svg";
import NextSearchRightImg from "./img/next-link-search-right.svg";

import NextLeftImg from "./img/next-link-left.svg";
import NextRightImg from "./img/next-link-right.svg";

import MdToolbarIconEmphasis from "./img/markdown-tool-emphasis.svg";
import MdToolbarIconHeader from "./img/markdown-tool-header.svg";
import MdToolbarIconItalic from "./img/markdown-tool-italic.svg";
import MdToolbarIconOrderedList from "./img/markdown-tool-ordered-list.svg";
import MdToolbarIconScratched from "./img/markdown-tool-scratched.svg";
import MdToolbarIconTable from "./img/markdown-tool-table.svg";
import MdToolbarIconLink from "./img/markdown-tool-link.svg";
import MdToolbarIconEmojiList from "./img/markdown-tool-unordered-emoji-list.svg";
import MdToolbarUnorderedList from "./img/markdown-tool-unordered-list.svg";

import { MdSmallCardRender } from "./../markdown/MarkdownRender";

import { joinClasses } from "../util/elClass.js";
import { remoteErrorHandler } from "./../remoteErrorHandler";

import {
  Button,
  ButtonGroup,
  DropdownButton,
  Dropdown,
  Row,
  Col,
  ListGroup,
  Form,
  Modal,
} from "react-bootstrap";

import axios from "axios";
import keycode from "keycode";
import moment from "moment";
import queryString from "query-string";

import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";

class MarkdownToolbarImpl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modalShow: false,
    };
    this.fetchCancelToken = axios.CancelToken.source();
  }

  static propTypes = {
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
  };

  componentWillUnmount() {
    this.fetchCancelToken.cancel();
  }

  handleIdleClick = (event) => {};

  render() {
    return (
      <>
        <ButtonGroup
          vertical
          className={joinClasses(styles.toolbar, styles.toolbar_right)}
        >
          <Button
            variant="light"
            onClick={this.handleIdleClick}
            className={styles.toolbar_btn}
          >
            <img
              src={MdToolbarIconHeader}
              className={styles.toolbar_btn_img}
              alt="Header text"
            />
          </Button>
          <Button
            variant="light"
            onClick={this.handleIdleClick}
            className={styles.toolbar_btn}
          >
            <img
              src={MdToolbarIconEmphasis}
              className={styles.toolbar_btn_img}
              alt="Emphasised text"
            />
          </Button>
          <Button
            variant="light"
            onClick={this.handleIdleClick}
            className={styles.toolbar_btn}
          >
            <img
              src={MdToolbarIconItalic}
              className={styles.toolbar_btn_img}
              alt="Italic text"
            />
          </Button>
          <Button
            variant="light"
            onClick={this.handleIdleClick}
            className={styles.toolbar_btn}
          >
            <img
              src={MdToolbarIconScratched}
              className={styles.toolbar_btn_img}
              alt="Scratched text"
            />
          </Button>
          <Button
            variant="light"
            onClick={this.handleIdleClick}
            className={styles.toolbar_btn}
          >
            <img
              src={MdToolbarIconLink}
              className={styles.toolbar_btn_img}
              alt="Link"
            />
          </Button>
          <Button
            variant="light"
            onClick={this.handleIdleClick}
            className={styles.toolbar_btn}
          >
            <img
              src={MdToolbarIconTable}
              className={styles.toolbar_btn_img}
              alt="Table"
            />
          </Button>
          <Button
            variant="light"
            onClick={this.handleIdleClick}
            className={styles.toolbar_btn}
          >
            <img
              src={MdToolbarIconEmojiList}
              className={styles.toolbar_btn_img}
              alt="Emoji list"
            />
          </Button>
          <Button
            variant="light"
            onClick={this.handleIdleClick}
            className={styles.toolbar_btn}
          >
            <img
              src={MdToolbarIconOrderedList}
              className={styles.toolbar_btn_img}
              alt="Numbered list"
            />
          </Button>
          <Button
            variant="light"
            onClick={this.handleIdleClick}
            className={styles.toolbar_btn}
          >
            <img
              src={MdToolbarUnorderedList}
              className={styles.toolbar_btn_img}
              alt="Unordered list"
            />
          </Button>
        </ButtonGroup>
      </>
    );
  }
}

export const MarkdownToolbar = withRouter(MarkdownToolbarImpl);

export default MarkdownToolbar;
