import React from "react";
import ReactDOM from "react-dom";

// tools.js
import Embed from "@editorjs/embed";
import Table from "@editorjs/table";
import Paragraph from "@editorjs/paragraph";
import List from "@editorjs/list";
import Warning from "@editorjs/warning";
import Code from "@editorjs/code";
import LinkTool from "@editorjs/link";
import Image from "@editorjs/image";
import Raw from "@editorjs/raw";
import Header from "@editorjs/header";
import Quote from "@editorjs/quote";
import Marker from "@editorjs/marker";
import CheckList from "@editorjs/checklist";
import Delimiter from "@editorjs/delimiter";
import InlineCode from "@editorjs/inline-code";
import SimpleImage from "@editorjs/simple-image";

import EditorJs from "react-editor-js";

import {
  HeaderOne,
  HeaderTwo,
  HeaderThree,
  HeaderFour,
  HeaderFive,
  HeaderSix,
} from "../markdown/MarkdownRender";

import { joinClasses } from "../util/elClass.js";

export const EDITOR_JS_TOOLS = {
  embed: Embed,
  table: Table,
  paragraph: Paragraph,
  list: List,
  warning: Warning,
  code: Code,
  linkTool: LinkTool,
  image: Image,
  raw: Raw,
  header: Header,
  quote: Quote,
  marker: Marker,
  checklist: CheckList,
  delimiter: Delimiter,
  inlineCode: InlineCode,
  simpleImage: SimpleImage,
};
// import { EDITOR_JS_TOOLS } from './tools'

export class DocEditor extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    const data = {
      time: 1556098174501,
      blocks: [{ type: "header", data: { text: "Editor.js", level: 2 } }],
    };
    return <EditorJs data={data} tools={EDITOR_JS_TOOLS} />;
  }
}
