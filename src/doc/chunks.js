import React from "react";

import axios from "axios";
import keycode from "keycode";

import styles from "./chunks.module.css";

import { Button, ButtonGroup, InputGroup, Form } from "react-bootstrap";

import { smugler } from "./../smugler/api";

import { AutocompleteWindow } from "./../smartpoint/AutocompleteWindow";
import { MarkdownToolbar } from "./MarkdownToolBar.js";
import { joinClasses } from "../util/elClass.js";
import { renderMdCard } from "./../markdown/MarkdownRender";

import { MzdGlobalContext } from "./../lib/global";

import { parseRawSource as _parseRawSource } from "./mdRawParser";
import { makeChunk } from "./chunk_util";

import { HoverTooltip } from "./../lib/tooltip";

import EditButtonImg from "./img/edit-button.png";
import EditMoreButtonImg from "./img/edit-more-button.png";

export const parseRawSource = _parseRawSource;

class ChunkRenderToolbar extends React.Component {
  constructor(props) {
    super(props);
  }

  makeMoreTooling() {
    if (!this.props.isFull) {
      return null;
    }
    return null;
    // return (
    //   <Button
    //     variant="light"
    //     className={joinClasses(
    //       styles.paragraph_toolbar_btn,
    //       styles.paragraph_toolbar_more_btn
    //     )}
    //   >
    //     <img
    //       src={EditMoreButtonImg}
    //       className={styles.btn_img}
    //       alt={"Edit paragraph"}
    //     />
    //   </Button>
    // );
  }

  render() {
    return (
      <ButtonGroup vertical>
        <Button
          variant="light"
          onClick={this.props.enableEditMode}
          className={joinClasses(styles.paragraph_toolbar_btn)}
        >
          <HoverTooltip tooltip={"Edit"}>
            <img
              src={EditButtonImg}
              className={styles.btn_img}
              alt={"Edit paragraph"}
            />
          </HoverTooltip>
        </Button>
        {this.makeMoreTooling()}
      </ButtonGroup>
    );
  }
}

export class ChunkRender extends React.Component {
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

  enableEditMode = () => {
    this.props.editChunk(this.props.index);
  };

  render() {
    // &#x270E;
    const toolbar = this.props.edit ? null : (
      <ChunkRenderToolbar
        enableEditMode={this.enableEditMode}
        isFull={this.state.hover}
      />
    );
    const card =
      this.props.editOpts != null ? (
        <TextEditor
          value={this.props.chunk.source}
          nid={this.props.nid}
          replaceChunks={this.props.replaceChunks}
          mergeChunkUp={this.props.mergeChunkUp}
          editChunk={this.props.editChunk}
          index={this.props.index}
          editOpts={this.props.editOpts}
          account={this.props.account}
        />
      ) : (
        <ChunkView
          nid={this.props.nid}
          chunk={this.props.chunk}
          index={this.props.index}
          replaceChunks={this.props.replaceChunks}
          render={renderMdCard}
        />
      );
    return (
      <div
        className={joinClasses(styles.fluid_container)}
        onMouseEnter={this.onHover}
        onMouseLeave={this.offHover}
      >
        <div className={joinClasses(styles.fluid_paragraph_toolbar)}>
          {toolbar}
        </div>
        {card}
      </div>
    );
  }
}

export function ChunkView({
  chunk,
  nid,
  index,
  replaceChunks,
  render,
  ...rest
}) {
  var type = chunk.type || 0;
  return render({
    source: chunk.source,
    nid: nid,
    update: (source) => {
      const { chunks } = parseRawSource(source);
      replaceChunks(chunks, index);
    },
  });
}

export function createEmptyChunk() {
  return {
    type: 0,
    source: "",
  };
}

const kEditorLineHeightPx = 38;
const kMinEditorHeightPx = kEditorLineHeightPx + 2;

export class TextEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: this.props.value,
      height: this.getInitialHeight(this.props.value),
      modalShow: false,
      keyCounterSlash: 0,
    };
    this.textAreaRef = React.createRef();
    this.createEdgeCancelToken = axios.CancelToken.source();
  }

  componentDidMount() {
    this.textAreaRef.current.focus();

    const editOpts = this.props.editOpts;
    if (editOpts.begin) {
      const begin = editOpts.begin;
      const end = editOpts.end || begin;
      this.textAreaRef.current.setSelectionRange(begin, end);
    }

    const topbar = this.context.topbar;
    topbar.reset(this.createEditorToolbar());
  }

  componentWillUnmount() {
    this.createEdgeCancelToken.cancel();

    const topbar = this.context.topbar;
    topbar.reset(null);
  }

  createEditorToolbar() {
    return (
      <MarkdownToolbar
        textAreaRef={this.textAreaRef}
        updateText={this.updateText}
      />
    );
  }

  handleKeyDown = (event) => {
    const key = event.key;
    const keyCode = event.keyCode;
    const textRef = this.textAreaRef.current;
    if (textRef == null) {
      return;
    }
    if (key === "/") {
      const prefix = textRef.value.slice(0, textRef.selectionStart);
      if (prefix.endsWith("/")) {
        event.preventDefault();
        this.setState({
          modalShow: true,
        });
      }
    } else if (
      keyCode === keycode("enter") &&
      textRef.selectionStart === textRef.selectionEnd
    ) {
      var prefix = textRef.value.slice(0, textRef.selectionStart);
      if (prefix.endsWith("\n")) {
        prefix = prefix.trim();
        if (prefix.length > 0) {
          event.preventDefault();
          const suffix = textRef.value.slice(textRef.selectionStart);
          const left = makeChunk(prefix);
          const rigth = makeChunk(suffix.trim());
          const goToIndex = this.props.index + 1;
          this.props.replaceChunks([left, rigth], this.props.index, goToIndex);
        }
      }
    } else if (
      keyCode === keycode("backspace") &&
      0 === textRef.selectionStart &&
      0 === textRef.selectionEnd
    ) {
      event.preventDefault();
      const source = this.state.value.trim();
      const chunk = makeChunk(source);
      const goToIndex = this.props.index - 1;
      this.props.mergeChunkUp(
        chunk,
        this.props.index,
        goToIndex,
        -source.length
      );
    } else if (
      0 !== this.props.index &&
      keyCode === keycode("up") &&
      0 === textRef.selectionStart &&
      0 === textRef.selectionEnd
    ) {
      event.preventDefault();
      const { chunks } = parseRawSource(this.state.value);
      const goToIndex = this.props.index - 1;
      this.props.replaceChunks(chunks, this.props.index, goToIndex);
    } else if (
      keyCode === keycode("down") &&
      textRef.textLength === textRef.selectionStart &&
      textRef.textLength === textRef.selectionEnd
    ) {
      event.preventDefault();
      const { chunks } = parseRawSource(this.state.value);
      const goToIndex = this.props.index + 1;
      this.props.replaceChunks(chunks, this.props.index, goToIndex);
    }
  };

  handleChange = (event) => {
    const value = event.target.value;
    const ref = event.target;
    this.setState({
      value: value,
      height: this.getAdjustedHeight(ref, kMinEditorHeightPx),
    });
  };

  updateText = (value, cursorPosBegin, cursorPosEnd) => {
    this.setState(
      {
        value: value,
        height: this.getAdjustedHeight(
          this.textAreaRef.current,
          kMinEditorHeightPx
        ),
      },
      () => {
        this.textAreaRef.current.focus();
        // if (cursorPosBegin) {
        //   if (!cursorPosEnd) {
        //     cursorPosEnd = cursorPosBegin;
        //   }
        //   this.textAreaRef.current.setSelectionRange(
        //     cursorPosBegin,
        //     cursorPosEnd
        //   );
        // }
      }
    );
  };

  handleReplaceSmartpoint = (replacement) => {
    if (this.textAreaRef.current && this.textAreaRef.current.selectionStart) {
      const cursorPosEnd = this.textAreaRef.current.selectionStart;
      const cursorPosBegin = cursorPosEnd - 1;
      const replacementLen = replacement.length;
      this.setState(
        (state) => {
          // A beginning without smarpoint spell (/)
          const beginning = state.value.slice(0, cursorPosBegin);
          // Just an ending
          const ending = state.value.slice(cursorPosEnd);
          return {
            value: beginning + replacement + ending,
            modalShow: false,
          };
        },
        () => {
          // Selection of the inserted text piece
          this.textAreaRef.current.focus();
          // this.textAreaRef.current.setSelectionRange(
          //   cursorPosBegin,
          //   cursorPosBegin + replacementLen
          // );
        }
      );
    }
  };

  handleSmartpointOnInsert = ({ text }) => {
    this.handleReplaceSmartpoint(text);
  };

  componentDidUpdate(prevProps, prevState) {}

  getInitialHeight = (text) => {
    const eols = text.match(/\n/g);
    const numberOfLines = eols ? eols.length + 1 : 1;
    const numberOfLinesByTextLength = text.length / 62;

    return Math.max(
      Math.max(numberOfLines, numberOfLinesByTextLength) * kEditorLineHeightPx,
      kMinEditorHeightPx
    );
  };

  getAdjustedHeight = (el, minHeight) => {
    // compute the height difference which is caused by border and outline
    var outerHeight = parseInt(window.getComputedStyle(el).height, 10);
    var diff = outerHeight - el.clientHeight;
    // set the height to 0 in case of it has to be shrinked
    // el.style.height = 0;
    // el.scrollHeight is the full height of the content, not just the visible part
    return Math.max(minHeight, el.scrollHeight + diff);
  };

  _saveAndQuitEditing = () => {
    const { chunks } = parseRawSource(this.state.value);
    this.props.replaceChunks(chunks, this.props.index);
    this.props.editChunk(-1);
  };

  showModal = () => {
    this.setState({ modalShow: true });
  };

  hideModal = () => {
    this.setState({ modalShow: false });
    this.textAreaRef.current.focus();
  };

  render() {
    return (
      <>
        <AutocompleteWindow
          show={this.state.modalShow}
          onHide={this.hideModal}
          on_insert={this.handleSmartpointOnInsert}
          nid={this.props.nid}
          account={this.props.account}
        />
        <ExtClickDetector
          callback={this._saveAndQuitEditing}
          isActive={!this.state.modalShow}
        >
          <InputGroup className={joinClasses(styles.editor_input_group)}>
            <Form.Control
              as="textarea"
              aria-label="With textarea"
              className={styles.editor_form}
              value={this.state.value}
              onChange={this.handleChange}
              onKeyDown={this.handleKeyDown}
              style={{ height: this.state.height + "px" }}
              ref={this.textAreaRef}
            />
          </InputGroup>
        </ExtClickDetector>
      </>
    );
  }
}

TextEditor.contextType = MzdGlobalContext;

class ExtClickDetector extends React.Component {
  constructor(props) {
    super(props);
    this.selfRef = React.createRef();
  }
  componentDidMount() {
    document.addEventListener("mousedown", this.handleClick, {
      capture: false,
      passive: true,
    });
  }
  componentWillUnmount() {
    document.removeEventListener("mousedown", this.handleClick, {
      capture: false,
    });
  }
  handleClick = (event) => {
    if (
      this.props.isActive &&
      !this.selfRef.current.contains(event.target) &&
      !event.target.classList.contains("ignoreextclick")
    ) {
      this.props.callback(event);
    }
  };
  render() {
    return <div ref={this.selfRef}>{this.props.children}</div>;
  }
}
