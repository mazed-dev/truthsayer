import React, { useContext } from "react";

import styles from "./ReadOnlyRender.module.css";

import { Loader } from "../lib/loader";
import LockedImg from "./../img/locked.png";

import { StaticNode } from "./NodeEditor";

import { renderMdSmallCard } from "./../markdown/MarkdownRender";

import { ChunkView } from "./chunks";
import { enforceTopHeader } from "./doc_util.jsx";
import { makeEmptyChunk, trimChunk } from "./chunk_util";
import { smugler } from "./../smugler/api";

import { MzdGlobalContext } from "../lib/global.js";

const kMaxTrimSmallCardSize = 320;
const kMaxTrimSmallCardChunksNum = 4;
const kMaxTrimChunksNum = 6;

function SmallCardRender({ nid, doc }) {
  return <StaticNode doc={doc} nid={nid} small />;
}

class ReadDocRender extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let body = null;
    const node = this.props.node;
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
        body = <SmallCardRender doc={node.doc} nid={node.nid} />;
      }
    }
    return <div className={styles.read_only_card}>{body}</div>;
  }
}

class ReadOnlyRenderFetching extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      node: null,
    };
    this.fetchNodeCancelToken = smugler.makeCancelToken();
  }

  componentDidMount() {
    this.fetchNode();
  }

  componentWillUnmount() {
    this.fetchNodeCancelToken.cancel();
  }

  componentDidUpdate(prevProps) {
    // Don't forget to compare props!
    if (this.props.nid !== prevProps.nid) {
      this.fetchNode();
    }
  }

  fetchNode = () => {
    const nid = this.props.nid;
    let account = this.props.account;
    return smugler.node
      .get({
        nid: nid,
        cancelToken: this.fetchNodeCancelToken.token,
        account: account,
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
    if (this.state.node) {
      return <ReadDocRender node={this.state.node} />;
    } else {
      return <Loader size={"medium"} />;
    }
  }
}

export function ReadOnlyRender({ nid, node, ...rest }) {
  const ctx = useContext(MzdGlobalContext);
  if (node) {
    return <ReadDocRender node={node} {...rest} />;
  } else {
    return <ReadOnlyRenderFetching nid={nid} account={ctx.account} {...rest} />;
  }
}
