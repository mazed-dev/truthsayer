import React, { useContext } from "react";

import { ButtonToolbar, ButtonGroup } from "react-bootstrap";

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

import { joinClasses } from "../../util/elClass.js";

import { InlineStyleControls } from "./InlineStyleControls";
import { BlockStyleControls } from "./BlockStyleControls";
import { LinkEditor } from "./LinkEditor";
import { ControlButton } from "./ControlButton";

import styles from "./ControlsToolbar.module.css";

export class ControlsToolbar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showInput: false,
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
          showInput: true,
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
        showInput: false,
        urlValue: "",
      },
      () => {
        setTimeout(() => focusBack(), 0);
      }
    );
  };

  render() {
    let {
      editorState,
      onStateChange,
      toggleBlockType,
      toggleInlineStyle,
      className,
    } = this.props;
    let urlInput;
    if (this.state.showInput) {
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
    className = joinClasses(className, styles.toolbar);
    return (
      <ButtonGroup className={className}>
        <BlockStyleControls
          editorState={editorState}
          onToggle={toggleBlockType}
        />
        <InlineStyleControls
          editorState={editorState}
          onToggle={toggleInlineStyle}
          onStateChange={onStateChange}
        />
        <LinkEditor editorState={editorState} onStateChange={onStateChange} />
      </ButtonGroup>
    );
  }
}
