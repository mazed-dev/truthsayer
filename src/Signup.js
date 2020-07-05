import React from "react";

import { Card, Button, Form, Container, Row, Col } from "react-bootstrap";

import axios from "axios";
import { withRouter } from "react-router-dom";

class Signup extends React.Component {
  constructor(props) {
    super(props);
    var email = "";
    if (this.props.location.state.email) {
      email = this.props.location.state.email;
    }
    this.state = {
      name: "",
      email: email,
      consent: false,
    };
    this.consentRef = React.createRef();
    this.emailInputRef = React.createRef();
    this.nameInputRef = React.createRef();

    this.axiosCancelToken = axios.CancelToken.source();
  }

  componentDidMount() {
    this.nameInputRef.current.focus();
  }

  componentWillUnmount() {
    this.axiosCancelToken.cancel();
  }

  handleNameChange = (event) => {
    this.setState({ name: event.target.value });
  };

  handleEmailChange = (event) => {
    this.setState({ email: event.target.value });
  };

  toggleConsent = (event) => {
    this.setState({ consent: this.consentRef.current.checked });
  };

  isReadyToSubmit = () => {
    const isReady =
      this.state.consent &&
      this.state.name.length > 1 &&
      this.emailInputRef.current.validity.valid;
    return isReady;
  };

  onSubmit = (event) => {
    event.preventDefault();
    const value = {
      name: this.state.name,
      email: this.state.email,
    };
    axios
      .post("/api/auth", value, {
        cancelToken: this.axiosCancelToken.token,
      })
      .catch(function (err) {
        alert("Error " + err);
      })
      .then((res) => {
        if (res) {
          if (res.data.wait) {
            this.props.history.push("/waiting-list", {
              name: this.state.name,
              email: this.state.email,
            });
          } else {
            this.props.onLogin();
          }
        }
      });
  };

  render() {
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
                    ref={this.nameInputRef}
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
                    ref={this.emailInputRef}
                  />
                </Col>
              </Form.Group>
              <Card.Text>
                Mazed currently is under active development, therefore there is
                no guarantie of any kind.
              </Card.Text>
              <Form.Group as={Row} controlId="formCustomerAggreementCheckbox">
                <Form.Label column sm="2">
                  I agree, go on
                </Form.Label>
                <Col sm="2">
                  <Form.Check
                    type="checkbox"
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

export default withRouter(Signup);
