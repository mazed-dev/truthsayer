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
import { NO_EXT_CLICK_DETECTION } from "./../FullNodeView";

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

  updateText = (txt, begin, end) => {
    this.props.updateText(txt, begin, end);
  };

  handleIdleClick = (event) => {
    // console.log(this.props.textAreaRef.current);
  };

  isTextAreaRefValid() {
    return (
      this.props.textAreaRef.current &&
      this.props.textAreaRef.current.value &&
      this.props.textAreaRef.current.selectionStart &&
      this.props.textAreaRef.current.selectionEnd
    );
  }

  insertHeaderClick = (event) => {
    if (!this.isTextAreaRefValid()) {
      return;
    }
    const txtRef = this.props.textAreaRef.current;

    var beginPos = txtRef.value.lastIndexOf("\n", txtRef.selectionStart);
    if (beginPos < 0) {
      beginPos = 0;
    } else {
      beginPos = beginPos + 1;
    }
    const hdr = txtRef.value.slice(beginPos, txtRef.selectionEnd);

    const prefix = txtRef.value.slice(0, beginPos);
    const suffix = txtRef.value.slice(txtRef.selectionEnd);
    const match = hdr.match("^(#){1,5} ");
    var newValue;
    if (match && match.length && match.length > 0) {
      var pos = match[0].length;
      var newHdr;
      if (pos > 5) {
        newHdr = hdr.slice(pos);
      } else {
        newHdr = "#".repeat(pos) + " " + hdr.slice(pos);
      }
      newValue = prefix + newHdr + suffix;
    } else {
      newValue = prefix + "# " + hdr + suffix;
    }
    this.updateText(newValue, txtRef.selectionStart, txtRef.selectionEnd);
  };

  wrapTextSelectionWith = (wrap) => {
    if (!this.isTextAreaRefValid()) {
      return;
    }
    const txtRef = this.props.textAreaRef.current;

    const selected = txtRef.value.slice(
      txtRef.selectionStart,
      txtRef.selectionEnd
    );
    const prefix = txtRef.value.slice(0, txtRef.selectionStart);
    const suffix = txtRef.value.slice(txtRef.selectionEnd);
    const newValue = prefix + wrap + selected + wrap + suffix;
    const wrapLn = wrap.length;
    this.updateText(
      newValue,
      txtRef.selectionStart + wrapLn,
      txtRef.selectionEnd + wrapLn
    );
  };

  emphasiseTextClick = () => {
    this.wrapTextSelectionWith("**");
  };

  italicTextClick = () => {
    this.wrapTextSelectionWith("*");
  };

  scratchedTextClick = () => {
    this.wrapTextSelectionWith("~~");
  };

  linkTextClick = () => {
    if (!this.isTextAreaRefValid()) {
      return;
    }
    const txtRef = this.props.textAreaRef.current;

    const selected = txtRef.value.slice(
      txtRef.selectionStart,
      txtRef.selectionEnd
    );
    const prefix = txtRef.value.slice(0, txtRef.selectionStart);
    const suffix = txtRef.value.slice(txtRef.selectionEnd);
    const newValue = prefix + "[" + selected + "](https://...)" + suffix;
    this.updateText(
      newValue,
      txtRef.selectionStart + 1,
      txtRef.selectionEnd + 1
    );
  };

  insertTableClick = () => {
    if (!this.isTextAreaRefValid()) {
      return;
    }
    const txtRef = this.props.textAreaRef.current;

    const prefix = txtRef.value.slice(0, txtRef.selectionStart);
    const suffix = txtRef.value.slice(txtRef.selectionStart);
    const emptyTable = String.raw`

|  #   |     |     |
| ---: | --- | --- |
|  1   |     |     |
|  2   |     |     |
|  3   |     |     |
|  4   |     |     |
`;
    const newValue = prefix + emptyTable + suffix;
    this.updateText(newValue, txtRef.selectionStart + 4);
  };

  makeNumberedListClick = () => {
    if (!this.isTextAreaRefValid()) {
      return;
    }
  };

  render() {
    return (
      <>
        <ButtonGroup vertical className={joinClasses(styles.toolbar_group)}>
          <Button
            variant="light"
            onClick={this.insertHeaderClick}
            className={joinClasses(styles.toolbar_btn, NO_EXT_CLICK_DETECTION)}
          >
            <img
              src={MdToolbarIconHeader}
              className={joinClasses(
                styles.toolbar_btn_img,
                NO_EXT_CLICK_DETECTION
              )}
              alt="Header text"
            />
          </Button>
          <Button
            variant="light"
            onClick={this.emphasiseTextClick}
            className={joinClasses(styles.toolbar_btn, NO_EXT_CLICK_DETECTION)}
          >
            <img
              src={MdToolbarIconEmphasis}
              className={joinClasses(
                styles.toolbar_btn_img,
                NO_EXT_CLICK_DETECTION
              )}
              alt="Emphasised text"
            />
          </Button>
          <Button
            variant="light"
            onClick={this.italicTextClick}
            className={joinClasses(styles.toolbar_btn, NO_EXT_CLICK_DETECTION)}
          >
            <img
              src={MdToolbarIconItalic}
              className={joinClasses(
                styles.toolbar_btn_img,
                NO_EXT_CLICK_DETECTION
              )}
              alt="Italic text"
            />
          </Button>
          <Button
            variant="light"
            onClick={this.scratchedTextClick}
            className={joinClasses(styles.toolbar_btn, NO_EXT_CLICK_DETECTION)}
          >
            <img
              src={MdToolbarIconScratched}
              className={joinClasses(
                styles.toolbar_btn_img,
                NO_EXT_CLICK_DETECTION
              )}
              alt="Strike out text"
            />
          </Button>
          <Button
            variant="light"
            onClick={this.linkTextClick}
            className={joinClasses(styles.toolbar_btn, NO_EXT_CLICK_DETECTION)}
          >
            <img
              src={MdToolbarIconLink}
              className={joinClasses(
                styles.toolbar_btn_img,
                NO_EXT_CLICK_DETECTION
              )}
              alt="Link"
            />
          </Button>
          <Button
            variant="light"
            onClick={this.insertTableClick}
            className={joinClasses(styles.toolbar_btn, NO_EXT_CLICK_DETECTION)}
          >
            <img
              src={MdToolbarIconTable}
              className={joinClasses(
                styles.toolbar_btn_img,
                NO_EXT_CLICK_DETECTION
              )}
              alt="Table"
            />
          </Button>
          <Button
            variant="light"
            onClick={this.makeNumberedListClick}
            className={joinClasses(styles.toolbar_btn, NO_EXT_CLICK_DETECTION)}
          >
            <img
              src={MdToolbarIconOrderedList}
              className={joinClasses(
                styles.toolbar_btn_img,
                NO_EXT_CLICK_DETECTION
              )}
              alt="Numbered list"
            />
          </Button>
          <Button
            variant="light"
            onClick={this.handleIdleClick}
            className={joinClasses(styles.toolbar_btn, NO_EXT_CLICK_DETECTION)}
          >
            <img
              src={MdToolbarUnorderedList}
              className={joinClasses(
                styles.toolbar_btn_img,
                NO_EXT_CLICK_DETECTION
              )}
              alt="Unordered list"
            />
          </Button>
          <Button
            variant="light"
            onClick={this.handleIdleClick}
            className={joinClasses(styles.toolbar_btn, NO_EXT_CLICK_DETECTION)}
          >
            <img
              src={MdToolbarIconEmojiList}
              className={joinClasses(
                styles.toolbar_btn_img,
                NO_EXT_CLICK_DETECTION
              )}
              alt="Emoji list"
            />
          </Button>
        </ButtonGroup>
      </>
    );
  }
}

export const MarkdownToolbar = withRouter(MarkdownToolbarImpl);

export default MarkdownToolbar;
