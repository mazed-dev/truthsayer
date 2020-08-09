import React from "react";

import {
  Button,
  Row,
  Col,
} from "react-bootstrap";

import Emoji from "./../Emoji";

export class EmojiSmartItem extends React.Component {
  constructor(props) {
    super(props);
  }

  handleSumbit = () => {
    this.props.on_insert(this.props.emoji);
  };

  render() {
    return (
      <Row
        className="justify-content-between w-100 p-0 m-0"
        onClick={this.handleSumbit}
      >
        <Col sm md lg xl={8}>
          <Emoji symbol={this.props.emoji} label={this.props.label} />
          &nbsp;
          <i>{this.props.label}</i>
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

export default EmojiSmartItem;
