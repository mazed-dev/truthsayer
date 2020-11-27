import React from "react";

import styles from "./doc.module.css";

import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";

// FIXME(akindyakov)
import "./../full_node_view/FullNodeView.css";

import { renderMdSmallCard } from "./../markdown/MarkdownRender";
import { fetchNode, updateNode } from "./../smugler/api";
import remoteErrorHandler from "./../remoteErrorHandler";

import { joinClasses } from "../util/elClass.js";

import {
  ChunkRender,
  ChunkView,
  parseRawSource,
  createEmptyChunk,
} from "./chunks";

import { mergeChunks } from "./chunk_util";

import { Card, Button } from "react-bootstrap";

import moment from "moment";
import axios from "axios";

export class DocRenderImpl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      chunks: [],
      crtd: null,
      upd: null,
      edit_chunk_index: this.isEditingStart() ? 0 : null,
    };
    this.fetchCancelToken = axios.CancelToken.source();
    this.updateCancelToken = axios.CancelToken.source();
  }

  static propTypes = {
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
  };

  componentDidUpdate(prevProps) {
    // Don't forget to compare props!
    if (this.props.nid !== prevProps.nid) {
      this.fetchNode();
    }
  }

  componentWillUnmount() {
    this.fetchCancelToken.cancel();
    // No, we have to save whatever we have here
    // this.updateCancelToken.cancel();
  }

  componentDidMount() {
    this.fetchNode();
  }

  fetchNode = () => {
    return fetchNode({
      nid: this.props.nid,
      cancelToken: this.fetchCancelToken.token,
    })
      .catch(remoteErrorHandler(this.props.history))
      .then((res) => {
        if (res) {
          this.setState({
            chunks: exctractDoc(res.data).chunks,
            crtd: moment(res.headers["x-created-at"]),
            upd: moment(res.headers["last-modified"]),
          });
        }
      });
  };

  updateNode = (doc, to_edit_index) => {
    const lastIndex = this.state.chunks.length - 1;
    if (to_edit_index > lastIndex) {
      to_edit_index = lastIndex;
    }
    this.setState({
      chunks: doc.chunks,
      crtd: moment(),
      upd: moment(),
      edit_chunk_index: to_edit_index,
    });
    return updateNode({
      nid: this.props.nid,
      doc: doc,
      cancelToken: this.updateCancelToken.token,
    }).catch(remoteErrorHandler(this.props.history));
  };

  editChunk = (index) => {
    //*dbg*/ console.log("edit chunk", index);
    const lastIndex = this.state.chunks.length - 1;
    if (index > lastIndex) {
      index = lastIndex;
    }
    this.setState({
      edit_chunk_index: index,
    });
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
  replaceChunk = (chunks, index, to_index) => {
    const newChunks = this.state.chunks
      .slice(0, index)
      .concat(chunks)
      .concat(this.state.chunks.slice(index + 1));
    const newDoc = {
      chunks: newChunks,
    };
    return this.updateNode(newDoc, to_index);
  };

  /**
   * Merge the chunk with one above
   */
  mergeChunkUp = (chunk, index, to_index) => {
    if (index === 0) {
      // Nothing to merge with, just replace the current one
      return this.replaceChunk([chunk], index, to_index);
    }
    const prevIndex = index - 1;
    const newChunk = mergeChunks(this.state.chunks[prevIndex], chunk);
    const newChunks = this.state.chunks
      .slice(0, prevIndex)
      .concat([newChunk])
      .concat(this.state.chunks.slice(index + 1));
    const newDoc = {
      chunks: newChunks,
    };
    return this.updateNode(newDoc, to_index);
  };

  isEditingStart() {
    return this.props.location.state && this.props.location.state.edit;
  }

  render() {
    const chunks =
      this.state.chunks && this.state.chunks.length > 0
        ? this.state.chunks
        : [createEmptyChunk()];
    const edit_chunk_index = this.state.edit_chunk_index;
    const chunksEl = chunks.map((chunk, index) => {
      if (chunk == null) {
        chunk = createEmptyChunk();
      }
      const key = index.toString();
      const edit = index === edit_chunk_index;
      return (
        <ChunkRender
          chunk={chunk}
          key={key}
          nid={this.props.nid}
          index={index}
          resetAuxToolbar={this.props.resetAuxToolbar}
          replace_chunks={this.replaceChunk}
          merge_chunk_up={this.mergeChunkUp}
          edit_chunk={this.editChunk}
          edit={edit}
        />
      );
    });
    const upd = this.state.upd ? (
      <i>Updated {this.state.upd.fromNow()}</i>
    ) : null;
    return (
      <Card
        className={joinClasses(styles.fluid_container, styles.doc_render_card)}
      >
        <Card.Body className={joinClasses(styles.doc_render_card_body)}>
          {chunksEl}
        </Card.Body>
        <footer className="text-right m-2">
          <small className="text-muted">{upd}</small>
        </footer>
      </Card>
    );
  }
}

export const DocRender = withRouter(DocRenderImpl);

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
