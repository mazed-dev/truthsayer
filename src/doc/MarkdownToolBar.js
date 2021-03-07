import React from "react";

import styles from "./MarkdownToolBar.module.css";

import MdToolbarIconEmphasis from "./img/markdown-tool-emphasis.png";
import MdToolbarIconHeader from "./img/markdown-tool-header.png";
import MdToolbarIconItalic from "./img/markdown-tool-italic.png";
import MdToolbarIconOrderedList from "./img/markdown-tool-ordered-list.png";
import MdToolbarIconScratched from "./img/markdown-tool-scratched.png";
import MdToolbarIconTable from "./img/markdown-tool-table.png";
import MdToolbarIconLink from "./img/markdown-tool-link.png";
import MdToolbarIconEmojiList from "./img/markdown-tool-unordered-emoji-list.png";
import MdToolbarUnorderedList from "./img/markdown-tool-unordered-list.png";

import { joinClasses } from "../util/elClass.js";
import { EMOJI_LIST_PRESETS } from "./EmojiListPresets";

import { Button, ButtonGroup } from "react-bootstrap";

import axios from "axios";

import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";

var emoji = require("node-emoji");

export const NO_EXT_CLICK_DETECTION = "ignoreextclick";

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
      this.props.textAreaRef.current != null &&
      this.props.textAreaRef.current.value != null
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
    this.makeListWith((line, index) => {
      if (line.match("^ *[0-9]+. ")) {
        return "";
      }
      return index + 1 + ". ";
    });
  };

  makeUnorderedListClick = () => {
    this.makeListWith((line, index) => {
      if (line.match("^ *[*+-] ") || line === "") {
        return "";
      }
      return "- ";
    });
  };

  makeEmojiListClick = () => {
    const presetInd = Math.floor(Math.random() * EMOJI_LIST_PRESETS.length);
    const presetLen = EMOJI_LIST_PRESETS[presetInd].length;
    this.makeListWith((line, index) => {
      if (line.match("^ *[*+-] ") || line === "") {
        return "";
      }
      var point;
      emoji.replace(line, (em) => {
        point = em.emoji;
      });
      if (point) {
        return "- " + point + " ";
      }
      const itemInd = Math.floor(Math.random() * presetLen);
      const em = EMOJI_LIST_PRESETS[presetInd][itemInd];
      return "- " + em + " ";
    });
  };

  makeListWith = (fn) => {
    console.log("makeListWith");
    if (!this.isTextAreaRefValid()) {
      return;
    }
    console.log("makeListWith text area is valid");
    const txtRef = this.props.textAreaRef.current;

    const prefix = txtRef.value.slice(0, txtRef.selectionStart);
    const suffix = txtRef.value.slice(txtRef.selectionEnd);
    const selected = txtRef.value.slice(
      txtRef.selectionStart,
      txtRef.selectionEnd
    );
    const madeList = selected
      .split("\n")
      .map((line, ind) => {
        return fn(line, ind) + line;
      })
      .join("\n");
    const newValue = prefix + madeList + suffix;
    console.log("makeListWith - newValue");
    this.updateText(newValue, newValue.length);
  };

  render() {
    return (
      <>
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
          onClick={this.makeUnorderedListClick}
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
          onClick={this.makeEmojiListClick}
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
      </>
    );
  }
}

export const MarkdownToolbar = withRouter(MarkdownToolbarImpl);

export default MarkdownToolbar;
