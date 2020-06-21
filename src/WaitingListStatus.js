import React from "react";

import { Card, Button, Form, Container, Row, Col } from "react-bootstrap";

import axios from "axios";
import { withRouter } from "react-router-dom";

class WaitingListStatus extends React.Component {
  constructor(props) {
    super(props);
    // this.props.name
  }

  render() {
    return (
      <Container>
        <Card className="border-0">
          <Card.Body className="p-3">
            <Card.Title>Waiting list</Card.Title>
            <Card.Text>
              Thank you for your interest in Mazed! We received your application
              to join alpha users of Mazed. We will carefully consider it and
              will contact you as soon as possible.
            </Card.Text>
            <Card.Text>Apologises for the inconvenience.</Card.Text>
            <Card.Text>Mazed team</Card.Text>
          </Card.Body>
        </Card>
      </Container>
    );
  }
}

export default withRouter(WaitingListStatus);
