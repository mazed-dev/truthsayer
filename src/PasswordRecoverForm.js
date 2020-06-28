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

class PasswordRecoverForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      password: "",
      isReady: false,
      is_validating: true,
    };
    this.emailRef = React.createRef();
    this.axiosCancelToken = axios.CancelToken.source();
  }

  componentWillUnmount() {
    this.axiosCancelToken.cancel();
  }

  handlePasswordChange = (event) => {
    this.setState({ password: event.target.value });
    this.checkState();
  };

  checkState = () => {
    const isReady = this.state.password.length > 6;
    this.setState({ isReady: isReady });
  };

  onSubmit = (event) => {
    event.preventDefault();
    const value = {
      token: this.props.token,
      new_password: this.state.password,
    };
    axios
      .post("/api/auth/password-recover/reset", value, {
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
            <Card.Title>Set up new password</Card.Title>
            <Form className="m-4" onSubmit={this.onSubmit}>
              <Form.Group as={Row} controlId="formNewPassword">
                <Form.Label column sm="2">
                  New password
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
                Change password
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    );
  }
}

export default withRouter(PasswordRecoverForm);
