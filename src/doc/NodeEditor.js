import React from "react";
import ReactDOM from "react-dom";
import {
  Editor,
  EditorBlock,
  DraftEditorBlock,
  EditorState,
  RichUtils,
} from "draft-js";
import "draft-js/dist/Draft.css";
import "./NodeEditor.css";

import {
  HeaderOne,
  HeaderTwo,
  HeaderThree,
  HeaderFour,
  HeaderFive,
  HeaderSix,
} from "../markdown/MarkdownRender";

import { joinClasses } from "../util/elClass.js";

const { Map } = require("immutable");

const kBlockTypeH1 = "header-one";
const kBlockTypeH2 = "header-two";
const kBlockTypeH3 = "header-three";
const kBlockTypeH4 = "header-four";
const kBlockTypeH5 = "header-five";
const kBlockTypeH6 = "header-six";
const kBlockTypeQuote = "blockquote";
const kBlockTypeCode = "code-block";
const kBlockTypeAtomic = "atomic";
const kBlockTypeUnorderedItem = "unordered-list-item";
const kBlockTypeOrderedItem = "ordered-list-item";
const kBlockTypeUnstyled = "unstyled";

const kBlockTypeUnorderedCheckItem = "unordered-check-item";
const kBlockTypeOrderedCheckItem = "ordered-check-item";

const BlockHeaderOne = (props) => {
  return (
    <HeaderOne>
      <EditorBlock {...props} />
    </HeaderOne>
  );
};
const BlockHeaderTwo = (props) => {
  return (
    <HeaderTwo>
      <EditorBlock {...props} />
    </HeaderTwo>
  );
};
const BlockHeaderThree = (props) => {
  return (
    <HeaderThree>
      <EditorBlock {...props} />
    </HeaderThree>
  );
};
const BlockHeaderFour = (props) => {
  return (
    <HeaderFour>
      <EditorBlock {...props} />
    </HeaderFour>
  );
};
const BlockHeaderFive = (props) => {
  return (
    <HeaderFive>
      <EditorBlock {...props} />
    </HeaderFive>
  );
};
const BlockHeaderSix = (props) => {
  return (
    <HeaderSix>
      <EditorBlock {...props} />
    </HeaderSix>
  );
};

export default class ChecklistEditorBlock extends React.Component {
  // https://github.com/facebook/draft-js/issues/132
  constructor(props) {
    super(props);
    this.toggleChecked = this.toggleChecked.bind(this);
  }

  toggleChecked(event) {
    // const { blockProps, block } = this.props;
    // const { updateMetadataFn, returnFocusToEditor, checked } = blockProps;
    // const newChecked = !checked;
    // updateMetadataFn(block.getKey(), newChecked);
    // I also stop propagation, return focus to the editor and set some state here, but that's probably specific to my app
  }

  render() {
    const { offsetKey, blockProps } = this.props;
    // const { checked } = blockProps;
    const checked = true;
    const blockClassNames = joinClasses("ChecklistEditorBlock", { checked });
    return (
      <div className={blockClassNames} data-offset-key={offsetKey}>
        <input
          type="checkbox"
          checked={checked}
          onChange={this.toggleChecked}
        />
        <div className="text">
          <EditorBlock {...this.props} />
        </div>
      </div>
    );
  }
}

function myBlockRenderer(contentBlock) {
  const type = contentBlock.getType();
  console.log("Type ", type);
  switch (type) {
    case kBlockTypeUnorderedCheckItem:
      return {
        component: ChecklistEditorBlock,
        // updateMetadataFn,
        checked: !!contentBlock.getData().get("checked"),
      };
    default:
      return;
  }
}
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
    this.state = { editorState: EditorState.createEmpty() };
  }

  componentDidMount() {}

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
    editorState
      .getCurrentContent()
      .getBlockMap()
      .map((value, key) => {
        console.log("Block", key, value);
      });
    this.setState({ editorState });
  };

  focus = () => this.refs.editor.focus();

  handleKeyCommand = (command) => {
    const { editorState } = this.state;
    const newState = RichUtils.handleKeyCommand(editorState, command);
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
    return (
      <div className="RichEditor-root">
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
            blockRendererFn={myBlockRenderer}
            customStyleMap={styleMap}
            editorState={editorState}
            handleKeyCommand={this.handleKeyCommand}
            onChange={this.onChange}
            onTab={this.onTab}
            placeholder="Tell a story..."
            ref="editor"
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
    case "blockquote":
      return "RichEditor-blockquote";
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
  { label: "Bold", style: "BOLD" },
  { label: "Italic", style: "ITALIC" },
  { label: "Underline", style: "UNDERLINE" },
  { label: "Monospace", style: "CODE" },
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

// https://codesandbox.io/s/qw1rqjbll?file=/RichEditor.js:2700-4565
