import React from "react";

import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";

// FIXME(akindyakov)
import "./../full_node_view/FullNodeView.css";

import { renderMdSmallCard } from "./../markdown/MarkdownRender";

import { joinClasses } from "../util/elClass.js";

import {
  ChunkRender,
  ChunkView,
  parseRawSource,
  createEmptyChunk,
} from "./chunks";

import { mergeChunks } from "./chunk_util";

export class CardRenderImpl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      edit_index: this.isEditingStart() ? 0 : null,
    };
  }

  static propTypes = {
    location: PropTypes.object.isRequired,
  };

  // Chunks operations:
  // - Save and exit
  // - Go to the chunk above
  // - Go to the chunk below
  // - Split the chunk into two
  // - Merge the chunk with one above
  //
  // Basic opetaions:
  // - Insert
  // - Merge
  // - Go to or exit editing mode

  /**
   * Repace the chunk with index [index] with new chunks
   */
  replaceChunks = (chunks, index) => {
    const newChunks = (index > 0 ? this.props.doc.chunks.slice(0, index) : [])
      .concat(chunks)
      .concat(this.props.doc.chunks.slice(index + 1));
    const newDoc = {
      chunks: newChunks,
    };
    this.props.onEdit(newDoc);
  };

  /**
   * Merge the chunk with one above
   */
  mergeChunkUp = (chunk, index) => {
    if (index === 0) {
      this.replaceChunks([chunk], index);
    }
    const prevIndex = index - 1;
    const newChunk = mergeChunks(this.props.doc.chunks[prevIndex], chunk);
    const newChunks = this.props.doc.chunks
      .slice(0, prevIndex)
      .concat([newChunk])
      .concat(this.props.doc.chunks.slice(index + 1));
    const newDoc = {
      chunks: newChunks,
    };
    this.props.onEdit(newDoc);
  };

  editChunk = (index) => {
    this.setState({
      edit_index: index,
    });
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
    const edit_index =
      this.state.edit_index > index_of_last
        ? index_of_last
        : this.state.edit_index;
    const els = chunks.map((chunk, index) => {
      if (chunk == null) {
        chunk = createEmptyChunk();
      }
      const key = index.toString();
      const edit = index === edit_index;
      return (
        <ChunkRender
          chunk={chunk}
          key={key}
          nid={this.props.nid}
          index={index}
          resetAuxToolbar={this.props.resetAuxToolbar}
          replace_chunks={this.replaceChunks}
          merge_chunk_up={this.mergeChunkUp}
          edit_chunk={this.editChunk}
          edit={edit}
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
