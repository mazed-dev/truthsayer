import React from "react";

import {
  Button,
  Container,
  Card,
  Form,
  ListGroup, Row, Col,
} from "react-bootstrap";

import keycode from "keycode";

class SmartLine extends React.Component {
  constructor(props) {
    super(props);
    this.state = {}
  }

  render() {
    return (
      <Row className="justify-content-between w-100 p-0">
        <Col sm md lg xl={9}>
          {this.props.item}
        </Col>
        <Col sm md lg xl={1}>
          <Button variant="outline-success">from</Button>
        </Col>
        <Col sm md lg xl={1}>
          <Button variant="success">to</Button>
        </Col>
      </Row>
    );
  }
}

export default SmartLine;
