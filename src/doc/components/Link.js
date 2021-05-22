import React from "react";

import "./components.css";

import { Link as ReactRouterLink } from "react-router-dom";

import { RichUtils } from "draft-js";

import { ControlButton } from "./../editor/ControlButton";

import { joinClasses } from "../../util/elClass.js";

import { Keys, isSymbol, isHotkeyCopy } from "../../lib/Keys.jsx";

import styles from "./Link.module.css";

function onBlur() {
  console.log("onBlur");
}

function onFocus() {
  console.log("onFocus");
}

function onClick(e) {
  e.preventDefault();
  console.log("onClick --- ");
}

export function insertPiece(piece, value, start, end) {
  if (end >= 0 && start >= 0 && start <= end) {
    return value.slice(0, start) + piece + value.slice(end);
  }
  return value + piece;
}

export function deleteSelected(value, start, end) {
  if (start === end) {
    ++end;
  }
  return value.slice(0, start) + value.slice(end);
}

export function backspaceSelected(value, start, end) {
  if (start === end) {
    --start;
  }
  if (start < 0) {
    return value;
  }
  return value.slice(0, start) + value.slice(end);
}

class LinkEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: this.props.value,
    };
  }

  _onURLChange = (e) => {
    this.setState({ value: e.target.value });
  };

  _onLinkInputKeyDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Input key", e);
    if (isSymbol(e.which)) {
      this.setState({
        value: insertPiece(
          e.key,
          e.target.value,
          e.target.selectionStart,
          e.target.selectionEnd
        ),
      });
    }
    if (isHotkeyCopy(e)) {
      // const value=       e.target.value;
      // const selectionStart =      e.target.selectionStart;
      // const selectionEnd =       e.target.selectionEnd;
      // TODO(akindyakov) Requires permissions to run
      // navigator.clipboard.readText().then(clipText => {
      //   this.setState({
      //     value: insertPiece(
      //       clipText,
      //       value,
      //       selectionStart,
      //       selectionEnd)
      //   });
      // });
    }
    switch (e.which) {
      case Keys.ESC:
        // Cancel
        break;
      case Keys.ENTER:
        // Confirm
        break;
      case Keys.BACKSPACE:
        this.setState({
          value: backspaceSelected(
            e.target.value,
            e.target.selectionStart,
            e.target.selectionEnd
          ),
        });
        break;
      case Keys.DELETE:
        this.setState({
          value: deleteSelected(
            e.target.value,
            e.target.selectionStart,
            e.target.selectionEnd
          ),
        });
        break;
    }
  };

  __onDelete = () => {
    // const { contentState, onStateChange, onClose } = this.props;
    // const selection = contentState.getSelection();
    // if (!selection.isCollapsed()) {
    //   const newEditorState = RichUtils.toggleLink(contentState, selection, null);
    //   onStateChange(newEditorState);
    // }
    // onClose();
  };

  onDelete = () => {
    const { contentState, onStateChange, onClose, entityKey } = this.props;
    const entity = contentState.getEntity(entityKey);
    // TODO(akindyakov) Continue here!

    // if (!selection.isCollapsed()) {
    //   const newEditorState = RichUtils.toggleLink(contentState, selection, null);
    //   onStateChange(newEditorState);
    // }
    // onClose();
  };

  _confirmLink = () => {
    const { contentState, onStateChange, onClose, entityKey } = this.props;
    const newEditorState = contentState.mergeEntityData(entityKey, {
      url: this.state.value,
    });
    onClose();
  };

  // https://github.com/facebook/draft-js/issues/2137

  render() {
    const { contentState, entityKey } = this.props;
    const entity = contentState.getEntity(entityKey);
    console.log("Make toolbar ", entity.getData());
    // Where the fuck I'm supposed to get selection to remove url here?
    const { onClose, onSave } = this.props;
    return (
      <div className={styles.popover_root}>
        <div className={styles.popover}>
          <input
            onChange={this._onURLChange}
            className={styles.urlInput}
            type="url"
            value={this.state.value}
            onKeyDown={this._onLinkInputKeyDown}
            ref={(x) => (this.urlRef = x)}
          />
          <ControlButton onClick={this._confirmLink}>Confirm</ControlButton>
          <ControlButton onClick={this._closePopover}>Cancel</ControlButton>
          <ControlButton onClick={this.onDelete}>Delete</ControlButton>
        </div>
      </div>
    );
  }
}

export class Link extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showEditor: false,
    };
  }
  onMouseEnterHandler = () => {
    this.setState({
      showEditor: true,
    });
    console.log("enter");
  };

  onMouseLeaveHandler = () => {
    this.setState({
      showEditor: false,
    });
    console.log("leave");
  };

  onEditorClose = () => {
    this.setState({ showEditor: false });
  };
  // https://github.com/facebook/draft-js/issues/2137
  render() {
    const { contentState, children, entityKey, onStateChange } = this.props;
    const { url } = contentState.getEntity(entityKey).getData();
    const toolbar = this.state.showEditor ? (
      <LinkEditor
        value={url}
        onClose={this.onEditorClose}
        onStateChange={onStateChange}
        contentState={contentState}
        entityKey={entityKey}
      />
    ) : null;
    if (url.match(/^\w+$/)) {
      return (
        <div
          className={styles.link_wrap}
          onMouseEnter={this.onMouseEnterHandler}
          onMouseLeave={this.onMouseLeaveHandler}
        >
          <div className={styles.toolbar}>{toolbar}</div>
          <ReactRouterLink
            to={url}
            className={joinClasses(
              "doc_block_inline_link",
              "doc_block_inline_link_int"
            )}
            onBlur={onBlur}
            onFocus={onFocus}
          >
            {children}
          </ReactRouterLink>
        </div>
      );
    } else {
      return (
        <div
          className={styles.link_wrap}
          onMouseEnter={this.onMouseEnterHandler}
          onMouseLeave={this.onMouseLeaveHandler}
        >
          <div className={styles.toolbar}>{toolbar}</div>
          <a
            href={url}
            className={joinClasses(
              "doc_block_inline_link",
              "doc_block_inline_link_ext"
            )}
          >
            {children}
          </a>
        </div>
      );
    }
  }
}
