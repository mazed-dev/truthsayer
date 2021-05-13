import React, { useContext } from "react";

import { ButtonToolbar } from "react-bootstrap";

import {
  Editor,
  EditorBlock,
  DraftEditorBlock,
  EditorState,
  RichUtils,
  convertToRaw,
  convertFromRaw,
  CompositeDecorator,
  getDefaultKeyBinding,
} from "draft-js";

import {
  TChunk,
  TDraftDoc,
  TContentBlock,
  kBlockTypeAtomic,
  kBlockTypeCode,
  kBlockTypeH1,
  kBlockTypeH2,
  kBlockTypeH3,
  kBlockTypeH4,
  kBlockTypeH5,
  kBlockTypeH6,
  kBlockTypeHrule,
  kBlockTypeOrderedItem,
  kBlockTypeQuote,
  kBlockTypeUnorderedCheckItem,
  kBlockTypeUnorderedItem,
  kBlockTypeUnstyled,
  kEntityTypeBold,
  kEntityTypeItalic,
  kEntityTypeLink,
  kEntityTypeMonospace,
  kEntityTypeTime,
  kEntityTypeUnderline,
  kEntityTypeImage,
  kEntityMutable,
  kEntityImmutable,
} from "../types.jsx";

import { InlineStyleControls } from "./InlineStyleControls";
import { BlockStyleControls } from "./BlockStyleControls";

import styles from "./ControlsToolbar.modules.css";

export class ControlsToolbar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showURLInput: false,
      urlValue: "",
    };
  }

  _onURLChange = (e) => this.setState({ urlValue: e.target.value });

  _onLinkInputKeyDown = (e) => {
    if (e.which === 13) {
      this._confirmLink(e);
    }
  };

  _promptForLink = (e) => {
    e.preventDefault();
    const { editorState } = this.props;
    const selection = editorState.getSelection();
    if (!selection.isCollapsed()) {
      const contentState = editorState.getCurrentContent();
      const startKey = editorState.getSelection().getStartKey();
      const startOffset = editorState.getSelection().getStartOffset();
      const blockWithLinkAtBeginning = contentState.getBlockForKey(startKey);
      const linkKey = blockWithLinkAtBeginning.getEntityAt(startOffset);

      let url = "";
      if (linkKey) {
        const linkInstance = contentState.getEntity(linkKey);
        url = linkInstance.getData().url;
      }

      this.setState(
        {
          showURLInput: true,
          urlValue: url,
        },
        () => {
          setTimeout(() => this.urlRef.focus(), 0);
        }
      );
    }
  };

  _confirmLink = (e) => {
    e.preventDefault();
    const { editorState, onStateChange, focusBack } = this.props;
    const { urlValue } = this.state;
    const contentState = editorState.getCurrentContent();
    const contentStateWithEntity = contentState.createEntity(
      kEntityTypeLink,
      kEntityMutable,
      { url: urlValue }
    );
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    let newEditorState = EditorState.set(editorState, {
      currentContent: contentStateWithEntity,
    });
    newEditorState = RichUtils.toggleLink(
      newEditorState,
      newEditorState.getSelection(),
      entityKey
    );
    onStateChange(newEditorState);
    this.setState(
      {
        showURLInput: false,
        urlValue: "",
      },
      () => {
        setTimeout(() => focusBack(), 0);
      }
    );
  };

  render() {
    const { editorState, toggleBlockType, toggleInlineStyle } = this.props;
    let urlInput;
    if (this.state.showURLInput) {
      urlInput = (
        <div className={styles.urlInputContainer}>
          <input
            onChange={this._onURLChange}
            className={styles.urlInput}
            type="text"
            value={this.state.urlValue}
            onKeyDown={this._onLinkInputKeyDown}
            ref={(x) => (this.urlRef = x)}
          />
          <button onMouseDown={this._confirmLink}>Confirm</button>
        </div>
      );
    }
    return (
      <ButtonToolbar className={styles.toolbar}>
        <BlockStyleControls
          editorState={editorState}
          onToggle={toggleBlockType}
        />
        <InlineStyleControls
          editorState={editorState}
          onToggle={toggleInlineStyle}
        />
        <button onMouseDown={this._promptForLink} className={styles.button}>
          Add Link
        </button>
        <button onMouseDown={this._removeLink} className={styles.button}>
          Remove Link
        </button>
        {urlInput}
      </ButtonToolbar>
    );
  }
}
