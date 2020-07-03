import React from "react";

import { Card, Button, Form, Container, Row, Col } from "react-bootstrap";

import axios from "axios";
import { withRouter } from "react-router-dom";

class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: this.props.email,
      password: "",
      isReady: false,
    };
    this.emailRef = React.createRef();
    this.axiosCancelToken = axios.CancelToken.source();
  }

  componentDidMount() {
    // Just in case we are already logged in
    axios
      .get("/api/auth/session", {
        cancelToken: this.axiosCancelToken.token,
      })
      .then((res) => {
        if (res) {
          if (res.data.permissions === 0) {
            this.props.history.push("/waiting-list");
          } else {
            this.props.onLogin();
            this.props.history.push("/");
          }
        }
      });
  }

  componentWillUnmount() {
    this.axiosCancelToken.cancel();
  }

  handleEmailChange = (event) => {
    this.setState({ email: event.target.value });
    this.checkState();
  };

  handlePasswordChange = (event) => {
    this.setState({ password: event.target.value });
    this.checkState();
  };

  checkState = () => {
    const isReady = this.emailRef.current.validity.valid;
    this.setState({ isReady: isReady });
  };

  onSubmit = (event) => {
    event.preventDefault();
    const value = {
      email: this.state.email,
      pass: this.state.password,
      permissions: 31,
    };
    axios
      .post("/api/auth/session", value, {
        cancelToken: this.axiosCancelToken.token,
      })
      .catch(function (err) {
        alert("Error " + err);
      })
      .then((res) => {
        if (res) {
          if (res.data.permissions === 0) {
            this.props.history.push("/waiting-list");
          } else {
            this.props.onLogin();
            this.props.history.push("/");
          }
        }
      });
  };

  render() {
    return (
      <Container>
        <Card className="border-0">
          <Card.Body className="p-3">
            <Card.Title>Log in</Card.Title>
            <Form className="m-4" onSubmit={this.onSubmit}>
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
              <Button
                variant="secondary"
                type="submit"
                disabled={!this.state.isReady}
              >
                Go
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    );
  }
}

Login.defaultProps = {
  email: "",
};

export default withRouter(Login);
