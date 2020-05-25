import React from "react";

import { Card, Button, Form, Container, Row, Col } from "react-bootstrap";

import axios from "axios";
import { withRouter } from "react-router-dom";
import auth from "./auth/token";

class Signin extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: this.props.name,
      email: this.props.email,
      password: "",
      consent: false,
    };
    this.consentRef = React.createRef();
    this.emailRef = React.createRef();
  }

  handleNameChange = (event) => {
    this.setState({ name: event.target.value });
  };

  handleEmailChange = (event) => {
    this.setState({ email: event.target.value });
  };

  handlePasswordChange = (event) => {
    this.setState({ password: event.target.value });
  };

  toggleConsent = (event) => {
    this.setState({ consent: this.consentRef.current.checked });
  };

  isReadyToSubmit = () => {
    const isReady =
      this.state.consent &&
      this.state.name.length > 1 &&
      this.emailRef.current.validity.valid &&
      this.state.password.length > 6;
    return isReady;
  };

  onSubmit = (event) => {
    event.preventDefault();
    const value = {
      name: this.state.name,
      email: this.state.email,
      password: this.state.password,
    };
    axios
      .post("/api/auth", value)
      .catch(function (err) {
        alert("Error " + err);
      })
      .then((res) => {
        if (res) {
          auth.from_headers(res.headers);
          this.props.history.push({
            pathname: "/",
          });
        }
      });
  };

  render() {
    const customer_agreement_checkbox_id = "customer-agreement-check";
    return (
      <Container>
        <Card className="border-0">
          <Card.Body className="p-3">
            <Card.Title>Register an account</Card.Title>
            <Form className="m-4" onSubmit={this.onSubmit}>
              <Form.Group as={Row} controlId="formLoginName">
                <Form.Label column sm="2">
                  Your name
                </Form.Label>
                <Col>
                  <Form.Control
                    type="name"
                    placeholder="Gaius Julius Caesar"
                    value={this.state.name}
                    onChange={this.handleNameChange}
                  />
                </Col>
              </Form.Group>

              <Form.Group as={Row} controlId="formLoginEmail">
                <Form.Label column sm="2">
                  Email
                </Form.Label>
                <Col>
                  <Form.Control
                    type="email"
                    value={this.state.email}
                    onChange={this.handleEmailChange}
                    ref={this.emailRef}
                  />
                </Col>
              </Form.Group>

              <Form.Group as={Row} controlId="formLoginPassword">
                <Form.Label column sm="2">
                  Password
                </Form.Label>
                <Col>
                  <Form.Control
                    type="password"
                    value={this.state.password}
                    onChange={this.handlePasswordChange}
                  />
                </Col>
              </Form.Group>
              <Card.Text>
                This website is still under active development, therefore there
                is no guarantie of any kind.
              </Card.Text>
              <Form.Group as={Row} controlId="formCustomerAggreementCheckbox">
                <Form.Label column sm="2">
                  I agree, go on
                </Form.Label>
                <Col sm="2">
                  <Form.Check
                    type="checkbox"
                    id={customer_agreement_checkbox_id}
                    onChange={this.toggleConsent}
                    ref={this.consentRef}
                  />
                </Col>
              </Form.Group>
              <Button
                variant="secondary"
                type="submit"
                disabled={!this.isReadyToSubmit()}
              >
                Register
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    );
  }
}

Signin.defaultProps = {
  name: "",
  email: "",
};

export default withRouter(Signin);
