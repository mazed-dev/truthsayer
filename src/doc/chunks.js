import React from "react";

import keycode from "keycode";

import styles from "./chunks.module.css";

import { Button, ButtonGroup, InputGroup, Form } from "react-bootstrap";

import AutocompleteWindow from "./../smartpoint/AutocompleteWindow";
import { MarkdownToolbar } from "../full_node_view/MarkdownToolBar.js";
import { joinClasses } from "../util/elClass.js";
import { renderMdCard } from "./../markdown/MarkdownRender";

import { parseRawSource as _parseRawSource } from "./mdRawParser";
import { makeChunk } from "./chunk_util";

import EditButtonImg from "./img/edit-button.png";
import EditMoreButtonImg from "./img/edit-more-button.png";

export const parseRawSource = _parseRawSource;

export class ChunkRender extends React.Component {
  constructor(props) {
    super(props);
  }

  toggleEditMode = () => {
    this.props.edit_chunk(this.props.index);
  };

  render() {
    // &#x270E;
    const toolbar = this.props.edit ? null : (
      <ButtonGroup vertical>
        <Button
          variant="light"
          onClick={this.toggleEditMode}
          className={joinClasses(styles.paragraph_toolbar_btn)}
        >
          <img
            src={EditButtonImg}
            className={styles.btn_img}
            alt={"Edit paragraph"}
          />
        </Button>
        <Button
          variant="light"
          className={joinClasses(
            styles.paragraph_toolbar_btn,
            styles.paragraph_toolbar_more_btn
          )}
        >
          <img
            src={EditMoreButtonImg}
            className={styles.btn_img}
            alt={"Edit paragraph"}
          />
        </Button>
      </ButtonGroup>
    );
    const card = this.props.edit ? (
      <TextEditor
        value={this.props.chunk.source}
        nid={this.props.nid}
        resetAuxToolbar={this.props.resetAuxToolbar}
        replace_chunks={this.props.replace_chunks}
        merge_chunk_up={this.props.merge_chunk_up}
        edit_chunk={this.props.edit_chunk}
        index={this.props.index}
      />
    ) : (
      <ChunkView
        nid={this.props.nid}
        chunk={this.props.chunk}
        render={renderMdCard}
      />
    );
    return (
      <div className={joinClasses(styles.fluid_container)}>
        <div className={joinClasses(styles.fluid_paragraph_toolbar)}>
          {toolbar}
        </div>
        {card}
      </div>
    );
  }
}

/**
 * 0: paragraph
 * 1: header
 * 2: list
 * 3: image
 */
export function ChunkView({ chunk, children, render, ...rest }) {
  var type = chunk.type || 0;
  if (type == null || type < 0 || type > 3) {
    type = 0;
  }
  switch (type) {
    case 0:
      return (
        <ChunkParagraphRender source={chunk.source} render={render} {...rest} />
      );
    case 1:
      return (
        <ChunkHeaderRender source={chunk.source} render={render} {...rest} />
      );
    case 2:
      return (
        <ChunkListRender source={chunk.source} render={render} {...rest} />
      );
    case 3:
      return (
        <ChunkImageRender source={chunk.source} render={render} {...rest} />
      );
    default:
      return null;
  }
}

export function createEmptyChunk() {
  return {
    type: 0,
    source: "",
  };
}

class ChunkParagraphRender extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return this.props.render({ source: this.props.source });
  }
}

class ChunkHeaderRender extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return this.props.render({ source: this.props.source });
  }
}

class ChunkListRender extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return this.props.render({ source: this.props.source });
  }
}

class ChunkImageRender extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return this.props.render({ source: this.props.source });
  }
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
  }

  componentDidMount() {
    this.props.resetAuxToolbar(this.createEditorToolbar());
    this.textAreaRef.current.focus();
  }

  componentWillUnmount() {
    this.props.resetAuxToolbar();
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
    //*dbg*/ console.log("Key down", event.key);
    const key = event.key;
    const keyCode = event.keyCode;
    if (this.textAreaRef.current) {
      const textRef = this.textAreaRef.current;
      if (key === "/") {
        const prefix = textRef.value.slice(0, textRef.selectionStart);
        if (prefix.endsWith("/")) {
          event.preventDefault();
          this.setState({
            modalShow: true,
          });
        }
      } else if (keyCode === keycode("enter")) {
        const prefix = textRef.value.slice(0, textRef.selectionStart);
        const trimmedPrefix = prefix.trim();
        if (prefix.endsWith("\n") && trimmedPrefix.length > 0) {
          //*dbg*/ console.log("Enter - split up the chunk");
          const trimmedSuffix = textRef.value
            .slice(textRef.selectionStart)
            .trim();
          const left = makeChunk(trimmedPrefix);
          const rigth = makeChunk(trimmedSuffix);
          const goToIndex = this.props.index + 1;
          this.props.replace_chunks([left, rigth], this.props.index, goToIndex);
        }
      } else if (
        keyCode === keycode("backspace") &&
        0 === textRef.selectionStart
      ) {
        //*dbg*/ console.log("Backspace - Merge UP");
        const chunk = makeChunk(this.state.value);
        const goToIndex = this.props.index - 1;
        this.props.merge_chunk_up(chunk, this.props.index, goToIndex);
      } else if (keyCode === keycode("up") && 0 === textRef.selectionStart) {
        //*dbg*/ console.log("Up - save and jump to the one above");
        if (this.props.index !== 0) {
          const { chunks } = parseRawSource(this.state.value);
          const goToIndex = this.props.index - 1;
          this.props.replace_chunks(chunks, this.props.index, goToIndex);
        }
      } else if (
        keyCode === keycode("down") &&
        textRef.textLength === textRef.selectionStart
      ) {
        //*dbg*/ console.log("Down - save and jump to the one below");
        const { chunks } = parseRawSource(this.state.value);
        const goToIndex = this.props.index + 1;
        this.props.replace_chunks(chunks, this.props.index, goToIndex);
      }
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
    console.log("Update text", value);
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
    this.props.replace_chunks(chunks, this.props.index);
    this.props.edit_chunk(-1);
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
          on_insert={this.handleReplaceSmartpoint}
          nid={this.props.nid}
        />
        <ExtClickDetector
          callback={this._saveAndQuitEditing}
          isActive={!this.state.modalShow}
        >
          <InputGroup>
            <Form.Control
              as="textarea"
              aria-label="With textarea"
              className={joinClasses(styles.text_editor_input)}
              value={this.state.value}
              onChange={this.handleChange}
              onKeyDown={this.handleKeyDown}
              style={{
                height: this.state.height + "px",
                resize: null,
              }}
              ref={this.textAreaRef}
            />
          </InputGroup>
        </ExtClickDetector>
      </>
    );
  }
}

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
