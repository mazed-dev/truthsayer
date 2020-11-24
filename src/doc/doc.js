import React from "react";

import { Button, ButtonGroup, InputGroup, Form } from "react-bootstrap";

import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";

import axios from "axios";
import moment from "moment";

// FIXME(akindyakov)
import "./../full_node_view/FullNodeView.css";

import { renderMdSmallCard } from "./../markdown/MarkdownRender";

import AutocompleteWindow from "../smartpoint/AutocompleteWindow";

import { joinClasses } from "../util/elClass.js";

import { Emoji } from "../Emoji.js";

import {
  ChunkRender,
  ChunkView,
  parseRawSource,
  createEmptyChunk,
} from "./chunks";

export class CardRenderImpl extends React.Component {
  constructor(props) {
    super(props);
  }

  static propTypes = {
    location: PropTypes.object.isRequired,
  };

  onModifyChunk = (chunks, index) => {
    const newChunks = (index > 0 ? this.props.doc.chunks.slice(0, index) : [])
      .concat(chunks)
      .concat(this.props.doc.chunks.slice(index + 1));
    const newDoc = {
      chunks: newChunks,
    };
    this.props.onEdit(newDoc);
  };

  isEditingStart() {
    return this.props.location.state && this.props.location.state.edit;
  }

  render() {
    const chunks =
      this.props.doc &&
      this.props.doc.chunks &&
      this.props.doc.chunks.length > 0
        ? this.props.doc.chunks
        : [createEmptyChunk()];
    const index_of_last = chunks.length - 1;
    const els = chunks.map((chunk, index) => {
      if (chunk == null) {
        chunk = createEmptyChunk();
      }
      const key = index.toString();
      var edit_first = false;
      // if (index === index_of_last) {
      //   edit_first = this.isEditingStart();
      // }
      return (
        <ChunkRender
          chunk={chunk}
          key={key}
          index={index}
          resetAuxToolbar={this.props.resetAuxToolbar}
          onModify={this.onModifyChunk}
          edit_first={edit_first}
        />
      );
    });
    return <>{els}</>;
  }
}

export const CardRender = withRouter(CardRenderImpl);

export function SmallCardRender({ nid, doc, head }) {
  var els = null;
  if (doc && doc.chunks) {
    const index_of_last = doc.chunks.length - 1;
    els = doc.chunks.slice(0, head).map((chunk, index) => {
      if (chunk == null) {
        chunk = createEmptyChunk();
      }
      const key = index.toString();
      return (
        <ChunkView
          nid={nid}
          chunk={chunk}
          key={key}
          render={renderMdSmallCard}
        />
      );
    });
  }
  return <>{els}</>;
}

export function exctractDoc(source) {
  // TODO(akindyakov): add encryption here - decrypt
  if (typeof source === "object") {
    return source;
  }
  try {
    return JSON.parse(source);
  } catch (e) {
    console.log("Old style doc without mark up");
  }
  return parseRawSource(source);
}
