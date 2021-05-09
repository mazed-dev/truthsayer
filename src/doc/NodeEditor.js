import React from "react";
import ReactDOM from "react-dom";
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
import "draft-js/dist/Draft.css";
import keycode from "keycode";

import "./NodeEditor.css";
import styles from "./NodeEditor.module.css";
import "./components/components.css";

import {
  HeaderOne,
  HeaderTwo,
  HeaderThree,
  HeaderFour,
  HeaderFive,
  HeaderSix,
} from "../markdown/MarkdownRender";

import { joinClasses } from "../util/elClass.js";

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
} from "./types.jsx";

import { Link } from "./components/Link";
import { HRule } from "./components/HRule";
import { CheckBox } from "./components/CheckBox";

import { getDocDraft } from "./doc_util.jsx";

const { Map } = require("immutable");

/**
 * - Links
 *
 * Pro:
 * - Images
 * - Tables
 * - Date&time
 */

const kListMaxDepth = 4;

const kCommandShift = "tab-shift";

const kKeyCodeTab = keycode("tab");

const blockRenderMap = Map({
  [kBlockTypeH1]: { element: "h1" },
  [kBlockTypeH2]: { element: "h2" },
  [kBlockTypeH3]: { element: "h3" },
  [kBlockTypeH4]: { element: "h4" },
  [kBlockTypeH5]: { element: "h5" },
  [kBlockTypeH6]: { element: "h6" },
  [kBlockTypeQuote]: { element: "blockquote" },
  [kBlockTypeCode]: { element: "pre" },
  [kBlockTypeAtomic]: { element: "figure" },
  [kBlockTypeUnorderedItem]: { element: "ul" },
  [kBlockTypeOrderedItem]: { element: "ol" },
  [kBlockTypeUnstyled]: { element: "div", aliasedElements: ["p"] },
});

const kHeaderLevelRotation = Map({
  [kBlockTypeH1]: kBlockTypeH2,
  [kBlockTypeH2]: kBlockTypeH3,
  [kBlockTypeH3]: kBlockTypeH4,
  [kBlockTypeH4]: kBlockTypeH5,
  [kBlockTypeH5]: kBlockTypeH6,
  [kBlockTypeH6]: kBlockTypeH1,
});

export class NodeEditor extends React.Component {
  constructor(props) {
    super(props);

    this.decorator = new CompositeDecorator([
      {
        strategy: findLinkEntities,
        component: Link,
      },
    ]);
    const content = convertFromRaw(getDocDraft(this.props.doc));
    this.state = {
      editorState: EditorState.createWithContent(content, this.decorator),
      showURLInput: false,
      urlValue: "",
    };
    this.onURLChange = (e) => this.setState({ urlValue: e.target.value });
  }

  componentDidMount() {}

  componentDidUpdate(prevProps) {
    if (this.props.doc !== prevProps.doc) {
      const content = convertFromRaw(getDocDraft(this.props.doc));
      this.setState({
        editorState: EditorState.createWithContent(content, this.decorator),
      });
    }
  }

  onChange = (editorState) => {
    // console.log(
    //   "Editor content entity map",
    //   editorState.getCurrentContent().getEntityMap()
    // );
    // console.log(
    //   "Editor content block map",
    //   editorState.getCurrentContent().getBlockMap()
    // );
    // console.log(
    //   "Editor get plain text",
    //   editorState.getCurrentContent().getPlainText("---")
    // );
    // const contentState = editorState.getCurrentContent();
    // console.log("Content state", convertToRaw(contentState));
    // editorState
    //   .getCurrentContent()
    //   .getBlockMap()
    //   .map((value, key) => {
    //     console.log("Block", key, value);
    //   });
    this.setState({ editorState });
  };

  focus = () => {
    this.editorRef.focus();
  };

  updateBlockMetadata = (blockKey, path, metadata) => {
    let contentState = this.state.editorState.getCurrentContent();
    let updatedBlock = contentState
      .getBlockForKey(blockKey)
      .mergeIn(path, metadata);

    let blockMap = contentState.getBlockMap();
    blockMap = blockMap.merge({ [blockKey]: updatedBlock });
    contentState = contentState.merge({ blockMap });

    const newEditorState = EditorState.push(
      this.state.editorState,
      contentState,
      "metadata-update"
    );
    this.onChange(newEditorState);
  };

  myBlockRenderer = (contentBlock) => {
    const type = contentBlock.getType();
    //*dbg*/ console.log("Type ", type);
    switch (type) {
      case kBlockTypeUnorderedCheckItem:
        return {
          component: CheckBox,
          props: {
            updateMetadataFn: this.updateBlockMetadata,
          },
        };
      case kBlockTypeHrule:
        return {
          component: HRule,
        };
      default:
        return;
    }
  };

  _promptForLink = (e) => {
    e.preventDefault();
    const { editorState } = this.state;
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
    const { editorState, urlValue } = this.state;
    const contentState = editorState.getCurrentContent();
    const contentStateWithEntity = contentState.createEntity(
      kEntityTypeLink,
      kEntityMutable,
      { url: urlValue }
    );
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    const newEditorState = EditorState.set(editorState, {
      currentContent: contentStateWithEntity,
    });
    this.setState(
      {
        editorState: RichUtils.toggleLink(
          newEditorState,
          newEditorState.getSelection(),
          entityKey
        ),
        showURLInput: false,
        urlValue: "",
      },
      () => {
        setTimeout(() => this.focus(), 0);
      }
    );
  };

  _onLinkInputKeyDown = (e) => {
    if (e.which === 13) {
      this._confirmLink(e);
    }
  };

  _removeLink = (e) => {
    e.preventDefault();
    const { editorState } = this.state;
    const selection = editorState.getSelection();
    if (!selection.isCollapsed()) {
      this.setState({
        editorState: RichUtils.toggleLink(editorState, selection, null),
      });
    }
  };

  keyBindingFn = (event) => {
    // we press CTRL + K => return 'bbbold'
    // we use hasCommandModifier instead of checking for CTRL keyCode because different OSs have different command keys
    // if (KeyBindingUtil.hasCommandModifier(event) && event.keyCode === 75) { return 'bbbold'; }
    if (event.keyCode === kKeyCodeTab) {
      return kCommandShift;
    }
    // manages usual things, like: Ctrl+Z => return 'undo'
    return getDefaultKeyBinding(event);
  };

  handleKeyCommand = (command) => {
    const { editorState } = this.state;
    let newState;
    if (command === kCommandShift) {
      newState = RichUtils.onTab(null, this.state.editorState, kListMaxDepth);
    } else {
      newState = RichUtils.handleKeyCommand(editorState, command);
    }
    if (newState) {
      this.onChange(newState);
      return true;
    }
    return false;
  };

  onTab = (e) => {
    const maxDepth = 4;
    this.onChange(RichUtils.onTab(e, this.state.editorState, maxDepth));
  };

  toggleBlockType = (blockType) => {
    this.onChange(RichUtils.toggleBlockType(this.state.editorState, blockType));
  };
  toggleInlineStyle = (inlineStyle) => {
    this.onChange(
      RichUtils.toggleInlineStyle(this.state.editorState, inlineStyle)
    );
  };
  render() {
    const { editorState } = this.state;
    // If the user changes block type before entering any text, we can
    //     // either style the placeholder or hide it. Let's just hide it now.
    let className = "RichEditor-editor";
    var contentState = editorState.getCurrentContent();
    if (!contentState.hasText()) {
      if (contentState.getBlockMap().first().getType() !== kBlockTypeUnstyled) {
        className += " RichEditor-hidePlaceholder";
      }
    }

    let urlInput;
    if (this.state.showURLInput) {
      urlInput = (
        <div className={styles.urlInputContainer}>
          <input
            onChange={this.onURLChange}
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
      <div className="RichEditor-root">
        <div className={styles.buttons}>
          <button onMouseDown={this._promptForLink} className={styles.button}>
            Add Link
          </button>
          <button onMouseDown={this._removeLink} className={styles.button}>
            Remove Link
          </button>
        </div>
        {urlInput}
        <BlockStyleControls
          editorState={editorState}
          onToggle={this.toggleBlockType}
        />
        <InlineStyleControls
          editorState={editorState}
          onToggle={this.toggleInlineStyle}
        />
        <div className={className} onClick={this.focus}>
          <Editor
            blockStyleFn={getBlockStyle}
            blockRendererFn={this.myBlockRenderer}
            customStyleMap={styleMap}
            editorState={editorState}
            handleKeyCommand={this.handleKeyCommand}
            keyBindingFn={this.keyBindingFn}
            onChange={this.onChange}
            onTab={this.onTab}
            placeholder="Tell a story..."
            ref={(x) => (this.editorRef = x)}
            spellCheck={true}
          />
        </div>
      </div>
    );
  }
}
// Custom overrides for "code" style.
const styleMap = {
  CODE: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    fontFamily: '"Inconsolata", "Menlo", "Consolas", monospace',
    fontSize: 16,
    padding: 2,
  },
};

function getBlockStyle(block) {
  // TODO(akindyakov): Continue here applying custom styles for elements
  switch (block.getType()) {
    case kBlockTypeQuote:
      return "RichEditor-blockquote";
    case kBlockTypeH1:
      return "doc_component_header_1";
    case kBlockTypeH2:
      return "doc_component_header_2";
    case kBlockTypeH3:
      return "doc_component_header_3";
    case kBlockTypeH4:
      return "doc_component_header_4";
    case kBlockTypeH5:
      return "doc_component_header_5";
    case kBlockTypeH6:
      return "doc_component_header_6";
    case kBlockTypeUnstyled:
      return "doc_component_paragraph";
    default:
      return null;
  }
}

class StyleButton extends React.Component {
  constructor() {
    super();
    this.onToggle = (e) => {
      e.preventDefault();
      this.props.onToggle(this.props.style);
    };
  }
  render() {
    // Custom overrides for "code" style.
    let className = "RichEditor-styleButton";
    if (this.props.active) {
      className += " RichEditor-activeButton";
    }
    return (
      <span className={className} onMouseDown={this.onToggle}>
        {this.props.label}
      </span>
    );
  }
}
const BLOCK_TYPES = [
  { label: "H1", style: kBlockTypeH1 },
  { label: "H2", style: kBlockTypeH2 },
  { label: "H3", style: kBlockTypeH3 },
  { label: "H4", style: kBlockTypeH4 },
  { label: "H5", style: kBlockTypeH5 },
  { label: "H6", style: kBlockTypeH6 },
  { label: "Blockquote", style: kBlockTypeQuote },
  { label: "UL", style: kBlockTypeUnorderedItem },
  { label: "OL", style: kBlockTypeOrderedItem },
  { label: "Code Block", style: kBlockTypeCode },

  { label: "Check", style: kBlockTypeUnorderedCheckItem },
  { label: "Text", style: kBlockTypeUnstyled },
];

const BlockStyleControls = (props) => {
  const { editorState } = props;
  const selection = editorState.getSelection();
  const blockType = editorState
    .getCurrentContent()
    .getBlockForKey(selection.getStartKey())
    .getType();
  return (
    <div className="RichEditor-controls">
      {BLOCK_TYPES.map((type) => (
        <StyleButton
          key={type.label}
          active={type.style === blockType}
          label={type.label}
          onToggle={props.onToggle}
          style={type.style}
        />
      ))}
    </div>
  );
};

var INLINE_STYLES = [
  { label: "Bold", style: kEntityTypeBold },
  { label: "Italic", style: kEntityTypeItalic },
  { label: "Underline", style: kEntityTypeUnderline },
  { label: "Monospace", style: kEntityTypeMonospace },
];

const InlineStyleControls = (props) => {
  var currentStyle = props.editorState.getCurrentInlineStyle();
  return (
    <div className="RichEditor-controls">
      {INLINE_STYLES.map((type) => (
        <StyleButton
          key={type.label}
          active={currentStyle.has(type.style)}
          label={type.label}
          onToggle={props.onToggle}
          style={type.style}
        />
      ))}
    </div>
  );
};

function findLinkEntities(contentBlock, callback, contentState) {
  contentBlock.findEntityRanges((character) => {
    const entityKey = character.getEntity();
    return (
      entityKey !== null &&
      contentState.getEntity(entityKey).getType() === kEntityTypeLink
    );
  }, callback);
}

// https://codesandbox.io/s/qw1rqjbll?file=/RichEditor.js:2700-4565
// https://sendgrid.com/blog/how-we-use-draft-js-at-sendgrid/
