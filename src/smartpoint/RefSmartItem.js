import React from "react";

import {
  Button,
  Row,
  Col,
} from "react-bootstrap";

import moment from "moment";

import { MdSmallCardRender } from "./../MarkDownRender";

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
    var title = this.props.preface.match(/^.*/);
    if (title) {
      title = title[0];
      if (title.length === 0) {
        title = "ref";
      }
    } else {
      title = "ref";
    }
    title = title.replace(/^[# ]+/, "");
    this.replacement = "[" + title + "](" + this.props.nid + ")";
  }

  handleSumbit = () => {
    this.props.on_insert(this.replacement);
  };

  render() {
    const upd = moment.unix(this.props.upd).fromNow();
    return (
      <Row
        className="justify-content-between w-100 p-0 m-0"
        onClick={this.handleSumbit}
      >
        <Col sm md lg xl={8}>
          <MdSmallCardRender source={this.props.preface + "&hellip;"} />
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

export default RefSmartItem;
