import React from "react";

import { Button, Row, Col } from "react-bootstrap";

import axios from "axios";

import { createTextNode } from "./../smugler/api";

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
    createTextNode({
      text: text,
      cancelToken: this.addNodeRefCancelToken.token,
      from_nid: this.props.from_nid,
      to_nid: this.props.to_nid,
    }).then((res) => {
      if (res) {
        const nid = res.data.nid;
        const replacement = "[" + this.props.title + "](" + nid + ")";
        this.props.on_insert(replacement);
      }
    });
  };

  render() {
    return (
      <Row
        className="justify-content-between w-100 p-0 m-0"
        onClick={this.handleSumbit}
      >
        <Col sm md lg xl={8}>
          {this.props.label}
          &nbsp;
          <q>{this.props.title}</q>
        </Col>
        <Col sm md lg xl={2}>
          <Button
            variant="outline-success"
            size="sm"
            onClick={this.handleSumbit}
          >
            Insert
          </Button>
        </Col>
      </Row>
    );
  }
}

NextRefSmartItem.defaultProps = {
  from_nid: null,
  to_nid: null,
};

export function nextRefSmartItemSearch(input, nid, on_insert) {
  var ret = [];
  const next = input.match(/^next ?(.*)/i);
  if (next) {
    const title = next[1] ? next[1].trim() : "Next";
    ret.push(
      <NextRefSmartItem
        label={'Next, create new "next" note'}
        title={title}
        from_nid={nid}
        on_insert={on_insert}
        ref={React.createRef()}
      />
    );
  }

  const prev = input.match(/^(previ?o?u?s?|prior?)( .*)?/i);
  if (prev) {
    const title = prev[2] ? prev[2].trim() : "Previous";
    ret.push(
      <NextRefSmartItem
        label={'Previous, create new "prior" note'}
        title={title}
        to_nid={nid}
        on_insert={on_insert}
        ref={React.createRef()}
      />
    );
  }
  return ret;
}

export default NextRefSmartItem;
