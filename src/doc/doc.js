import React from "react";

import styles from "./doc.module.css";

import PropTypes from "prop-types";
import { withRouter, useHistory } from "react-router-dom";

import { renderMdSmallCard } from "./../markdown/MarkdownRender";
import { smugler } from "./../smugler/api";
import remoteErrorHandler from "./../remoteErrorHandler";

import { joinClasses } from "../util/elClass.js";

import {
  ChunkRender,
  ChunkView,
  parseRawSource,
  createEmptyChunk,
} from "./chunks";

import { mergeChunks, trimChunk, getChunkSize } from "./chunk_util";

import { Card } from "react-bootstrap";

import moment from "moment";
import axios from "axios";

export class DocRenderImpl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      chunks: [],
      crtd: null,
      upd: null,
      edit_chunk_opts: {
        index: this.isEditingStart() ? 0 : -1,
        begin: 0,
        end: 0,
      },
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
    if (
      this.props.nid !== prevProps.nid ||
      this.props.account !== prevProps.account
    ) {
      // if (this.isEditingStart()) {
      //   this.setState({ edit_chunk_opts: { index: 0, } });
      // }
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
    const nid = this.props.nid;
    if (!this.props.account || !this.props.account.getLocalCrypto()) {
      return;
    }
    return smugler.node
      .get({
        nid: nid,
        cancelToken: this.fetchCancelToken.token,
        crypto: this.props.account.getLocalCrypto(),
      })
      .catch(remoteErrorHandler(this.props.history))
      .then((node) => {
        if (node) {
          this.setState({
            chunks: node.doc.chunks,
            crtd: node.created_at,
            upd: node.updated_at,
          });
        }
      });
  };

  updateNode = (doc, toIndex, selectionStart) => {
    const length = doc.chunks.length;
    if (toIndex) {
      if (length > 0 && toIndex >= length) {
        toIndex = length - 1;
      }
    } else {
      toIndex = -1;
    }
    const editOpts = {
      index: toIndex || -1,
      begin: selectionStart || 0,
      end: selectionStart || 0,
    };
    this.setState({
      chunks: doc.chunks,
      crtd: moment(),
      upd: moment(),
      edit_chunk_opts: editOpts,
    });
    return smugler.node
      .update({
        nid: this.props.nid,
        doc: doc,
        cancelToken: this.updateCancelToken.token,
      })
      .catch(remoteErrorHandler(this.props.history));
  };

  editChunk = (index, begin, end) => {
    index = index || 0;
    const length = this.state.chunks.length;
    if (length > 0 && index >= length) {
      index = length - 1;
    }
    this.setState({
      edit_chunk_opts: {
        index: index,
        begin: begin || 0,
        end: end || 0,
      },
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
  replaceChunk = (chunks, index, toIndex, selectionStart) => {
    const newChunks = this.state.chunks
      .slice(0, index)
      .concat(chunks)
      .concat(this.state.chunks.slice(index + 1));
    const newDoc = {
      chunks: newChunks,
    };
    return this.updateNode(newDoc, toIndex, selectionStart);
  };

  /**
   * Merge the chunk with one above
   */
  mergeChunkUp = (chunk, index, toIndex, selectionStart) => {
    if (index === 0) {
      // Nothing to merge with, just replace the current one
      return this.replaceChunk([chunk], index, toIndex, selectionStart);
    }
    const prevIndex = index - 1;
    const newChunk = mergeChunks(this.state.chunks[prevIndex], chunk);
    if (selectionStart !== null && selectionStart < 0) {
      selectionStart = newChunk.source.length + selectionStart;
    }
    const newChunks = this.state.chunks
      .slice(0, prevIndex)
      .concat([newChunk])
      .concat(this.state.chunks.slice(index + 1));
    const newDoc = {
      chunks: newChunks,
    };
    return this.updateNode(newDoc, toIndex, selectionStart);
  };

  isEditingStart() {
    return this.props.location.state && this.props.location.state.edit;
  }

  render() {
    const chunks =
      this.state.chunks && this.state.chunks.length > 0
        ? this.state.chunks
        : [createEmptyChunk()];
    const edit_chunk_opts = this.state.edit_chunk_opts;
    const chunksEl = chunks.map((chunk, index) => {
      if (chunk == null) {
        chunk = createEmptyChunk();
      }
      const key = index.toString();
      const editOpts = index === edit_chunk_opts.index ? edit_chunk_opts : null;
      return (
        <ChunkRender
          chunk={chunk}
          key={key}
          nid={this.props.nid}
          index={index}
          resetAuxToolbar={this.props.resetAuxToolbar}
          replaceChunks={this.replaceChunk}
          mergeChunkUp={this.mergeChunkUp}
          editChunk={this.editChunk}
          editOpts={editOpts}
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

const kMaxTrimSmallCardSize = 320;
const kMaxTrimSmallCardChunksNum = 4;

export function SmallCardRender({ nid, doc, trim, ...rest }) {
  var els = [];
  if (doc && doc.chunks) {
    var fullTextSize = 0;
    var chunksNum = 0;
    for (var index in doc.chunks) {
      var chunk = doc.chunks[index] ?? createEmptyChunk();
      const chunkSize = getChunkSize(chunk);
      if (trim && fullTextSize + chunkSize > kMaxTrimSmallCardSize) {
        chunk = trimChunk(chunk, kMaxTrimSmallCardSize - fullTextSize);
      }
      fullTextSize += getChunkSize(chunk);
      chunksNum += 1;
      const key = index.toString();
      els.push(
        <ChunkView
          nid={nid}
          chunk={chunk}
          key={key}
          render={renderMdSmallCard}
        />
      );
      if (
        fullTextSize > kMaxTrimSmallCardSize ||
        chunksNum >= kMaxTrimSmallCardChunksNum
      ) {
        break;
      }
    }
  }
  return <div {...rest}>{els}</div>;
}

export function exctractDoc(source, nid) {
  // TODO(akindyakov): add encryption here - decrypt
  if (typeof source === "object") {
    return source;
  }
  try {
    return JSON.parse(source);
  } catch (e) {
    console.log("Old style doc without mark up", nid);
  }
  return parseRawSource(source);
}

export function createEmptyDoc() {
  let doc: TDoc = {
    chunks: [],
    encrypted: false,
  };
  return doc;
}
