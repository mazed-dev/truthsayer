import React from "react";

import { Card, Button, Form, Container, Row, Col } from "react-bootstrap";

import axios from "axios";
import { withRouter } from "react-router-dom";

class WaitingListStatus extends React.Component {
  constructor(props) {
    super(props);
    var name = "";
    var email = "";
    if (this.props.location.state) {
      if (this.props.location.state.email) {
        email = this.props.location.state.email;
      }
      if (this.props.location.state.name) {
        name = this.props.location.state.name;
      }
    }
    this.state = {
      name: name,
      email: email,
    };
  }

  render() {
    return (
      <Container>
        <Card className="border-0">
          <Card.Body className="p-3">
            <Card.Title>Submited</Card.Title>
            <Card.Text>
              Thank you <b>{this.state.name}</b> for your interest in Mazed!
            </Card.Text>
            <Card.Text>
              We are happy to confirm we received your application to join early
              users of Mazed. Further instructions will be sent to your email
              address <i>{this.state.email}</i> as soon as tool is ready to
              accept more customers.
            </Card.Text>
            <Card.Text>Mazed team</Card.Text>
          </Card.Body>
        </Card>
      </Container>
    );
  }
}

export default withRouter(WaitingListStatus);
