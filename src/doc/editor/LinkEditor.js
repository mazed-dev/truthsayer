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

import IconLink from "./img/icon-link-strip.svg";
import { ControlButton } from "./ControlButton";
import { joinClasses } from "../../util/elClass.js";

import styles from "./LinkEditor.module.css";

export class LinkEditor extends React.Component {
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

  _closePopover = () => {
    this.setState({
      showURLInput: false,
    });
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
    const { editorState, onStateChange } = this.props;
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
      () => {}
    );
  };

  _removeLink = (e) => {
    e.preventDefault();
    const { editorState, onStateChange } = this.props;
    const selection = editorState.getSelection();
    if (!selection.isCollapsed()) {
      const newEditorState = RichUtils.toggleLink(editorState, selection, null);
      onStateChange(newEditorState);
    }
  };

  render() {
    let { editorState, onToggle, className } = this.props;
    let urlInput;
    if (this.state.showURLInput) {
      urlInput = (
        <div className={styles.popover_root}>
          <div className={styles.popover}>
            <input
              onChange={this._onURLChange}
              className={styles.urlInput}
              type="text"
              value={this.state.urlValue}
              onKeyDown={this._onLinkInputKeyDown}
              ref={(x) => (this.urlRef = x)}
            />
            <ControlButton onClick={this._confirmLink}>Confirm</ControlButton>
            <ControlButton onClick={this._closePopover}>Cancel</ControlButton>
          </div>
        </div>
      );
    }
    className = joinClasses(className || null, styles.toolbar);
    // <ControlButton onClick={this._removeLink} className={styles.btn}>
    //   Remove Link
    // </ControlButton>
    return (
      <div className={className}>
        <ControlButton onClick={this._promptForLink} className={styles.btn}>
          <img className={styles.icon_img} src={IconLink} />
        </ControlButton>
        {urlInput}
      </div>
    );
  }
}
