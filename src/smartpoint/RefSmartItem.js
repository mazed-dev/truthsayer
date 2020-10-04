import React from "react";

import { Button, Row, Col } from "react-bootstrap";

import axios from "axios";
import moment from "moment";

import { MdSmallCardRender } from "./../markdown/MarkdownRender";

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
    const title = makeRefTitleFromPreface(this.props.preface);
    this.replacement = "[" + title + "](" + this.props.nid + ")";
    this.addNodeRefCancelToken = axios.CancelToken.source();
  }

  handleSumbit = () => {
    this.props.on_insert(this.replacement);
    this.addNodeReference();
  };

  addNodeReference = () => {
    const req = {
      from_nid: this.props.from_nid,
      txt: "next",
      weight: 100,
    };
    axios
      .post("/api/node/" + this.props.nid + "/to", req, {
        cancelToken: this.addNodeRefCancelToken.token,
      })
      .then((res) => {
        if (res) {
          // TODO(akindyakov): Refresh node references here, but how to do that?
        }
      });
  };

  render() {
    const upd = moment.unix(this.props.upd).fromNow();
    return (
      <Row
        className="justify-content-between w-100 p-0 m-0"
        onClick={this.handleSumbit}
      >
        <Col sm md lg xl={8}>
          <MdSmallCardRender source={this.props.preface + " &hellip;"} />
          <small className="text-muted">
            <i>Updated {upd}</i>
          </small>
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

function makeRefTitleFromPreface(preface) {
  var title = preface.match(/^.*/);
  if (title) {
    title = title[0];
    if (title.length === 0) {
      title = "ref";
    }
  } else {
    title = "ref";
  }
  title = title.replace(/^[# ]+/, "");
  return title;
}

export default RefSmartItem;
