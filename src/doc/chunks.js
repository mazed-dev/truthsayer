import React from "react";

import styles from "./chunks.module.css";

import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";

import { Button, ButtonGroup, InputGroup, Form } from "react-bootstrap";

import axios from "axios";
import moment from "moment";

import AutocompleteWindow from "./../smartpoint/AutocompleteWindow";
import { Emoji } from "../Emoji.js";
import { MarkdownToolbar } from "../full_node_view/MarkdownToolBar.js";
import { joinClasses } from "../util/elClass.js";
import { renderMdCard } from "./../markdown/MarkdownRender";

export class ChunkRender extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      edit: this.props.edit_first,
    };
  }

  toggleEditMode = () => {
    this.setState({ edit: !this.state.edit });
  };

  onEditExit_ = (source) => {
    this.setState({ edit: false });
    const { chunks } = parseRawSource(source);
    this.props.onModify(chunks, this.props.index);
  };

  render() {
    // <Button
    //   variant="light"
    //   onClick={this.toggleEditMode}
    //   className={joinClasses(styles.paragraph_toolbar_btn)}
    // >
    //   <Emoji symbol="⋯" label="more" />
    // </Button>
    const toolbar = this.state.edit ? null : (
      <ButtonGroup vertical>
        <Button
          variant="light"
          onClick={this.toggleEditMode}
          className={joinClasses(styles.paragraph_toolbar_btn)}
        >
          &#x270E;
        </Button>
      </ButtonGroup>
    );
    const card = this.state.edit ? (
      <TextEditor
        value={this.props.chunk.source}
        nid={this.props.nid}
        onExit={this.onEditExit_}
        resetAuxToolbar={this.props.resetAuxToolbar}
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

export function parseRawSource(source) {
  return {
    chunks: source
      .split("\n\n")
      .filter((src) => {
        return src != null && src.length > 0;
      })
      .map((src, index) => {
        return {
          type: 0,
          source: src,
        };
      }),
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

export class TextEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: this.props.value,
      height: 200,
      modalShow: false,
      modSlashCounter: 0,
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

  handleChange = (event) => {
    const value = event.target.value;
    const diff = event.nativeEvent.data;
    const ref = event.target;
    this.setState((state) => {
      // Check if it's a smartpoint
      var modSlashCounter = 0;
      var modalShow = false;
      if (diff === "/") {
        if (state.modSlashCounter === 0) {
          modSlashCounter = state.modSlashCounter + 1;
        } else {
          modalShow = true;
        }
      }
      return {
        modSlashCounter: modSlashCounter,
        modalShow: modalShow,
        value: value,
        height: this.getAdjustedHeight(ref, 20),
      };
    });
  };

  updateText = (value, cursorPosBegin, cursorPosEnd) => {
    this.setState(
      {
        value: value,
        height: this.getAdjustedHeight(this.textAreaRef.current, 20),
      },
      () => {
        this.textAreaRef.current.focus();
        if (cursorPosBegin) {
          if (!cursorPosEnd) {
            cursorPosEnd = cursorPosBegin;
          }
          this.textAreaRef.current.setSelectionRange(
            cursorPosBegin,
            cursorPosEnd
          );
        }
      }
    );
  };

  handleReplaceSmartpoint = (replacement) => {
    if (this.textAreaRef.current && this.textAreaRef.current.selectionStart) {
      const cursorPosEnd = this.textAreaRef.current.selectionStart;
      const cursorPosBegin = cursorPosEnd - 2;
      const replacementLen = replacement.length;
      this.setState(
        (state) => {
          // A beginning without smarpoint spell (//)
          const beginning = state.value.slice(0, cursorPosBegin);
          // Just an ending
          const ending = state.value.slice(cursorPosEnd);
          return {
            value: beginning + replacement + ending,
            modalShow: false,
          };
        },
        () => {
          this.textAreaRef.current.focus();
          this.textAreaRef.current.setSelectionRange(
            cursorPosBegin,
            cursorPosBegin + replacementLen
          );
        }
      );
    }
  };

  componentDidUpdate(prevProps, prevState) {}

  getAdjustedHeight = (el, minHeight) => {
    // compute the height difference which is caused by border and outline
    var outerHeight = parseInt(window.getComputedStyle(el).height, 10);
    var diff = outerHeight - el.clientHeight;
    // set the height to 0 in case of it has to be shrinked
    // el.style.height = 0;
    // el.scrollHeight is the full height of the content, not just the visible part
    return Math.max(minHeight, el.scrollHeight + diff);
  };

  _onExit = () => {
    this.props.onExit(this.state.value);
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
          callback={this._onExit}
          isActive={!this.state.modalShow}
        >
          <InputGroup>
            <Form.Control
              as="textarea"
              aria-label="With textarea"
              className={joinClasses(styles.text_editor_input)}
              value={this.state.value}
              onChange={this.handleChange}
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
