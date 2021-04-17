import React from "react";

import { Button, Row, Col } from "react-bootstrap";

import axios from "axios";

import { smugler } from "./../smugler/api";

import { NodeSmallCard, GenericSmallCard } from "./../NodeSmallCard";

export class NextRefSmartItem extends React.Component {
  constructor(props) {
    super(props);
    this.addNodeRefCancelToken = axios.CancelToken.source();
  }

  componentWillUnmount() {
    this.addNodeRefCancelToken.cancel();
  }

  handleSumbit = () => {
    this.createNextNode(this.props.title);
  };

  createNextNode = (title) => {
    const text = title ? "# " + title : "";
    smugler.node
      .create({
        text: text,
        cancelToken: this.addNodeRefCancelToken.token,
        from_nid: this.props.from_nid,
        to_nid: this.props.to_nid,
      })
      .then((node) => {
        if (node) {
          const nid = node.nid;
          const replacement = "[" + this.props.title + "](" + nid + ")";
          this.props.on_insert({
            replacement: replacement,
            nid: nid,
          });
        }
      });
  };

  render() {
    return (
      <GenericSmallCard onClick={this.handleSumbit} header={this.props.label}>
        &nbsp;
        <q>{this.props.title}</q>
      </GenericSmallCard>
    );
  }
}

NextRefSmartItem.defaultProps = {
  from_nid: null,
  to_nid: null,
};

export function nextRefSmartItemSearch(input, nid, on_insert) {
  var ret = [];
  const next = input.match(/^(next|new) ?(.*)/i);
  if (next) {
    const title = next[2] ? next[2].trim() : "New";
    ret.push(
      <NextRefSmartItem
        label={"Create as next"}
        title={title}
        from_nid={nid}
        on_insert={on_insert}
        ref={React.createRef()}
        key={"smart/next/new"}
      />
    );
  }

  const prev = input.match(/^(previ?o?u?s?|prior?)( .*)?/i);
  if (prev) {
    const title = prev[2] ? prev[2].trim() : "New";
    ret.push(
      <NextRefSmartItem
        label={"Create previous"}
        title={title}
        to_nid={nid}
        on_insert={on_insert}
        ref={React.createRef()}
        key={"smart/prev/new"}
      />
    );
  }
  return ret;
}

export default NextRefSmartItem;
