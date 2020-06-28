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

class PasswordRecoverRequest extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: this.props.email,
      reset_request_is_sent: false,
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
          this.props.history.push("/");
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

  checkState = () => {
    if (this.emailRef.current) {
      const isReady = this.emailRef.current.validity.valid;
      this.setState({ isReady: isReady });
    }
  };

  onSubmit = (event) => {
    event.preventDefault();
    const value = {
      email: this.state.email,
    };
    axios
      .post("/api/auth/password-recover/request", value, {
        cancelToken: this.axiosCancelToken.token,
      })
      .catch(function (err) {
        alert("Error " + err);
      })
      .then((res) => {
        if (res) {
          this.setState({
            reset_request_is_sent: true,
          });
        }
      });
  };

  onGoBackToMain = () => {
    this.props.history.push("/");
  };

  render() {
    var show;
    if (this.state.reset_request_is_sent) {
      show = (
        <>
          <Card.Text>
            Password request is successfully submitted &nbsp;
            <Emoji symbol="👍" label="!" />
          </Card.Text>
          <Card.Text>
            We will reach you out as soon as possible and provide an instruction
            of how to reset your password.
          </Card.Text>
          <Card.Text>
            Sincerely yours, Mazed team &nbsp;
            <Emoji symbol="🤓" label=":D" />
          </Card.Text>
          <ButtonGroup>
            <Button variant="outline-secondary" onClick={this.onGoBackToMain}>
              Go back
            </Button>
          </ButtonGroup>
        </>
      );
    } else {
      show = (
        <>
          <Card.Text>
            Please provide us a primary email &nbsp;
            <Emoji symbol="📨" label="email" />
            &nbsp; associated with your Mazed account so we can contact you and
            provide a password reset instruction
          </Card.Text>
          <Form className="m-4" onSubmit={this.onSubmit}>
            <Form.Group as={Row} controlId="formLoginEmail">
              <Form.Label column sm="2">
                email
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
            <ButtonGroup>
              <Button
                variant="secondary"
                type="submit"
                disabled={!this.state.isReady}
              >
                Reset password
              </Button>
              <Button variant="outline-secondary" onClick={this.onGoBackToMain}>
                Go back
              </Button>
            </ButtonGroup>
          </Form>
        </>
      );
    }
    return (
      <Container>
        <Card className="border-0">
          <Card.Body className="p-3">
            <Card.Title>Password reset</Card.Title>
            {show}
          </Card.Body>
        </Card>
      </Container>
    );
  }
}

PasswordRecoverRequest.defaultProps = {
  email: "",
};

export default withRouter(PasswordRecoverRequest);
