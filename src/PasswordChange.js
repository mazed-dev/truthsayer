import React from "react";

import {
  Card,
  Button,
  Form,
  Container,
  Row,
  Col,
  ButtonGroup,
} from "react-bootstrap";

import axios from "axios";
import { withRouter } from "react-router-dom";
import Emoji from "./Emoji";

class PasswordChange extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      password: "",
      new_password: "",
      confirm_new_password: "",
      is_ready: false,
      is_validating: true,
    };
    this.axiosCancelToken = axios.CancelToken.source();
  }

  componentWillUnmount() {
    this.axiosCancelToken.cancel();
  }

  handlePasswordChange = (event) => {
    this.setState({ password: event.target.value });
  };

  handleNewPasswordChange = (event) => {
    this.setState({ new_password: event.target.value });
    this.checkState();
  };

  handleConfirmNewPasswordChange = (event) => {
    this.setState({ confirm_new_password: event.target.value });
    this.checkState();
  };

  checkState = () => {
    const is_ready = this.state.new_password.length > 6;
    this.setState({ is_ready: is_ready });
  };

  onSubmit = (event) => {
    event.preventDefault();
    const value = {
      old_password: this.state.password,
      new_password: this.state.new_password,
    };
    axios
      .post("/api/auth/password-recover/change", value, {
        cancelToken: this.axiosCancelToken.token,
      })
      .catch(function (err) {
        alert("Error " + err);
      })
      .then((res) => {
        if (res) {
          this.props.history.push("/login");
        }
      });
  };

  render() {
    return (
      <Container>
        <Card className="border-0">
          <Card.Body className="p-3">
            <Card.Title>Change password</Card.Title>
            <Form className="m-4" onSubmit={this.onSubmit}>
              <Form.Group className="my-4" as={Row} controlId="formPassword">
                <Form.Label column sm="3">
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
              <Form.Group className="mb-1" as={Row} controlId="formNewPassword">
                <Form.Label column sm="3">
                  New password
                </Form.Label>
                <Col>
                  <Form.Control
                    type="password"
                    value={this.state.new_password}
                    onChange={this.handleNewPasswordChange}
                  />
                </Col>
              </Form.Group>
              <Form.Group className="mt-2" as={Row} controlId="formNewPassword">
                <Form.Label column sm="3">
                  Confirm new password
                </Form.Label>
                <Col>
                  <Form.Control
                    type="password"
                    value={this.state.confirm_new_password}
                    onChange={this.handleConfirmNewPasswordChange}
                  />
                </Col>
              </Form.Group>
              <Button
                variant="secondary"
                type="submit"
                disabled={!this.state.is_ready}
              >
                Change password
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    );
  }
}

export default withRouter(PasswordChange);
