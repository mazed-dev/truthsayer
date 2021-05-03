import React from "react";
import ReactDOM from "react-dom";
import {
  Editor,
  EditorBlock,
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

const { Map } = require('immutable');

const kBlockTypeH1 = "header-one";
const kBlockTypeH2 = "header-two";
const kBlockTypeH3 = "header-three";
const kBlockTypeH4 = "header-four";
const kBlockTypeH5 = "header-five";
const kBlockTypeH6 = "header-six";
const kBlockTypeQuote = "blockquote";
const kBlockTypeCode = "code-block";
const kBlockTypeAtomic = "atomic";
const kBlockTypeUl = "unordered-list-item";
const kBlockTypeOl = "ordered-list-item";
const kBlockTypeText = "unstyled";

const BlockHeaderOne = props => {
  return (<HeaderOne> <EditorBlock {...props} /> </HeaderOne>);
};
const BlockHeaderTwo = props => {
  return (<HeaderTwo> <EditorBlock {...props} /> </HeaderTwo>);
};
const BlockHeaderThree = props => {
  return (<HeaderThree> <EditorBlock {...props} /> </HeaderThree>);
};
const BlockHeaderFour = props => {
  return (<HeaderFour> <EditorBlock {...props} /> </HeaderFour>);
};
const BlockHeaderFive = props => {
  return (<HeaderFive> <EditorBlock {...props} /> </HeaderFive>);
};
const BlockHeaderSix = props => {
  return (<HeaderSix> <EditorBlock {...props} /> </HeaderSix>);
};

function myBlockRenderer(contentBlock) {
  const type = contentBlock.getType();
  console.log("Type ", type);
  if (type === kBlockTypeH1) {
    return {
      component: BlockHeaderOne,
      editable: true,
      props: {},
    };
  } else
  if (type === kBlockTypeH2) {
    return {
      component: BlockHeaderTwo,
      editable: true,
      props: {},
    };
  } else
  if (type === kBlockTypeH3) {
    return {
      component: BlockHeaderThree,
      editable: true,
      props: {},
    };
  } else
  if (type === kBlockTypeH4) {
    return {
      component: BlockHeaderFour,
      editable: true,
      props: {},
    };
  } else
  if (type === kBlockTypeH5) {
    return {
      component: BlockHeaderFive,
      editable: true,
      props: {},
    };
  } else
  if (type === kBlockTypeH6) {
    return {
      component: BlockHeaderSix,
      editable: true,
      props: {},
    };
  } else 
  {
  }
}
const blockRenderMap = Map({
  [kBlockTypeH1]: { element: "h1" },
  [kBlockTypeH2]: { element: "h2" },
  [kBlockTypeH3]: { element: "h3" },
  [kBlockTypeH4]: { element: "h4" },
  [kBlockTypeH5]: { element: "h5" },
  [kBlockTypeH6]: { element: "h6" },
  "blockquote": { element: "blockquote" },
  "code-block": { element: "pre" },
  "atomic": { element: "figure" },
  "unordered-list-item": { element: "ul" },
  "ordered-list-item": { element: "ol" },
  "unstyled": { element: "div",   aliasedElements: ['p'], },
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

  componentDidMount(){
  }

  onChange = (editorState) => {
    console.log("Editor content entity map", editorState.getCurrentContent().getEntityMap());
    console.log("Editor content block map", editorState.getCurrentContent().getBlockMap());
    console.log("Editor get plain text", editorState.getCurrentContent().getPlainText("---"));
    editorState.getCurrentContent().getBlockMap().map((value, key) => {
      console.log("Block", key, value);
    });
    this.setState({ editorState });
  };

  handleKeyCommand = (command, editorState) => {
    console.log("Command", command);
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      this.onChange(newState);
      return "handled";
    }
    return "not-handled";
  };

  _onBoldClick = () => {
    this.onChange(RichUtils.toggleInlineStyle(this.state.editorState, 'BOLD'));
  };

  _onHeaderClick = () => {
    const current = RichUtils.getCurrentBlockType(this.state.editorState);
    const nextBlockType = kHeaderLevelRotation.get(current) || kBlockTypeH1;
    this.onChange(RichUtils.toggleBlockType(
      this.state.editorState, nextBlockType,
    ));
  };

  _onOrderedListClick = () => {
    const current = RichUtils.getCurrentBlockType(this.state.editorState);
    const nextBlockType = current === kBlockTypeOl ? kBlockTypeText : kBlockTypeOl;
    this.onChange(RichUtils.toggleBlockType(
      this.state.editorState, nextBlockType,
    ));
  };

  _onUnorderedListClick = () => {
    const current = RichUtils.getCurrentBlockType(this.state.editorState);
    const nextBlockType = current === kBlockTypeUl ? kBlockTypeText : kBlockTypeUl;
    this.onChange(RichUtils.toggleBlockType(
      this.state.editorState, nextBlockType,
    ));
  };

  render() {
    return (
    <div className={joinClasses("mazed_node_editor_root")}>
      <button onClick={this._onBoldClick}>Bold</button>
      <button onClick={this._onHeaderClick}>H</button>
      <button onClick={this._onOrderedListClick}>OL</button>
      <button onClick={this._onUnorderedListClick}>UL</button>
      <Editor
        editorState={this.state.editorState}
        onChange={this.onChange}
        handleKeyCommand={this.handleKeyCommand}
        placeholder={"Type something..."}
        blockRendererFn={myBlockRenderer}
        blockRenderMap={blockRenderMap}
      />
    </div>
    );
  }
}
