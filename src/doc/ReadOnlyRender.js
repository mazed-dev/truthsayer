import React from "react";

import { Card, Button, ButtonGroup } from "react-bootstrap";
import PropTypes from "prop-types";

import styles from "./ReadOnlyRender.module.css";

import { Loader } from "../lib/loader";
import LockedImg from "./../img/locked.png";

import { renderMdSmallCard } from "./../markdown/MarkdownRender";

import { AuthorFooter } from "./../card/AuthorBadge";
import { ChunkRender, ChunkView, parseRawSource } from "./chunks";
import { enforceTopHeader } from "./doc_util.jsx";
import { exctractDoc } from "./doc.js";
import {
  mergeChunks,
  makeEmptyChunk,
  trimChunk,
  getChunkSize,
} from "./chunk_util";
import { smugler } from "./../smugler/api";

const kMaxTrimSmallCardSize = 320;
const kMaxTrimSmallCardChunksNum = 4;

function SmallCardRender({ nid, doc, trim, ...rest }) {
  var els = [];
  if (doc) {
    doc = enforceTopHeader(doc);
    var fullTextSize = 0;
    var chunksNum = 0;
    for (var index in doc.chunks) {
      var chunk = doc.chunks[index] || makeEmptyChunk();
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

export class ReadOnlyRender extends React.Component {
  constructor(props) {
    super(props);
    this.fetchPrefaceCancelToken = smugler.makeCancelToken();
    this.state = {
      node: null,
      crypto: null,
    };
  }

  componentDidUpdate(prevProps) {
    if (this.props.nid !== prevProps.nid) {
      if (this.state.preface == null) {
        this.fetchPreface();
      } else {
        this.setState({
          doc: exctractDoc(this.props.preface, this.props.nid),
        });
      }
    }
  }

  componentDidMount() {
    if (this.state.preface == null) {
      this.fetchPreface();
    } else {
      this.setState({
        doc: exctractDoc(this.props.preface, this.props.nid),
      });
    }
  }

  componentWillUnmount() {
    this.fetchPrefaceCancelToken.cancel();
  }

  fetchPreface = () => {
    let account = this.context.account;
    smugler.node
      .get({
        nid: this.props.nid,
        cancelToken: this.fetchPrefaceCancelToken.token,
        account: account,
      })
      .catch((error) => {
        console.log("Fetch node failed with error:", error);
      })
      .then((node) => {
        if (node) {
          this.setState({
            node: node,
          });
        }
      });
  };

  render() {
    console.log("ReadOnlyRender.render");
    let body = null;
    const node = this.state.node;
    if (node == null) {
      body = (
        <div className={styles.small_card_waiter}>
          <Loader size={"small"} />
        </div>
      );
    } else {
      if (!node.crypto.success) {
        body = (
          <>
            <img src={LockedImg} className={styles.locked_img} alt={"locked"} />
            Encrypted with an unknown secret:
            <code className={styles.locked_secret_id}>
              {node.crypto.secret_id}
            </code>
          </>
        );
      } else {
        //TODO(akindyakov): trim card here if shrinked!
        body = <SmallCardRender doc={node.doc} nid={this.props.nid} />;
      }
    }
    //TODO(akindyakov) AuthorFooter should not be here
    return (
      <div className={styles.read_only_card}>
        <div className={styles.card_body}>{body}</div>
        <AuthorFooter node={this.state.node} />
      </div>
    );
  }
}
