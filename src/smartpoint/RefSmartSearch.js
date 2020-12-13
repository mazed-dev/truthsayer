import React from "react";

import { Button, Row, Col } from "react-bootstrap";

import axios from "axios";
import moment from "moment";

import { MdSmallCardRender } from "./../markdown/MarkdownRender";
import { NodeSmallCard } from "./../NodeSmallCard";
import { exctractDocTitle } from "./../doc/doc_util";

export function extractRefSearcToken(input) {
  var token = input;
  var direction = null;
  const prefTo = input.match(/^(refe?r?e?n?c?e?|to|next) /i);
  if (prefTo) {
    const pref = prefTo[0];
    token = input.slice(pref.length);
    direction = "to";
  } else {
    const prefFrom = input.match(/^(from|prev?i?o?u?s?) /i);
    if (prefFrom) {
      const pref = prefFrom[0];
      token = input.slice(pref.length);
      direction = "from";
    }
  }
  return {
    token: token,
    direction: direction,
  };
}

export class RefSmartItem extends React.Component {
  constructor(props) {
    super(props);
    const title = ""; //FIXME exctractDocTitle(this.props.preface);
    this.replacement = "[" + title + "](" + this.props.nid + ")";
    this.addNodeRefCancelToken = axios.CancelToken.source();
  }

  handleSumbit = () => {
    this.props.on_insert(this.replacement);
    this.addNodeReference();
  };

  addNodeReference = () => {
    const req = {
      edges: [
        {
          from_nid: this.props.from_nid,
          to_nid: this.props.nid,
        },
      ],
    };
    axios
      .post("/api/node/" + this.props.nid + "/edge", req, {
        cancelToken: this.addNodeRefCancelToken.token,
      })
      .then((res) => {
        if (res) {
          // TODO(akindyakov): Refresh node references here, but how to do that?
        }
      });
  };

  render() {
    return (
      <NodeSmallCard
        nid={this.props.nid}
        preface={this.props.preface}
        crtd={this.props.crtd}
        upd={this.props.upd}
        key={this.props.nid}
        skip_input_edge={false}
        edges={[]}
        onClick={this.handleSumbit}
      />
    );
  }
}

export function refSmartItemSearch(input, callback) {
  var { token } = extractRefSearcToken(input);
  if (token == null) {
    return;
  }
  const req = { q: token };
  axios
    .post("/api/node-search", req, {
      cancelToken: this.searchFetchCancelToken.token,
    })
    .then((res) => {
      const items = res.data.nodes.map((meta) => {
        return (
          <RefSmartItem
            nid={meta.nid}
            from_nid={this.props.nid}
            preface={meta.preface}
            upd={meta.upd}
            crtd={meta.crtd}
            on_insert={this.props.on_insert}
            ref={React.createRef()}
          />
        );
      });
      callback(items);
    })
    .catch((error) => {});
}

export default RefSmartItem;
