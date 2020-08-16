import React from "react";

import { Card, Button, Form, Container, Row, Col } from "react-bootstrap";

import "./Signup.css";

import PropTypes from "prop-types";
import axios from "axios";
import { Link, withRouter } from "react-router-dom";
import HttpStatus from "http-status-codes";

class Signup extends React.Component {
  constructor(props) {
    super(props);
    var email = "";
    if (
      this.props.location &&
      this.props.location.state &&
      this.props.location.state.email
    ) {
      email = this.props.location.state.email;
    }
    this.state = {
      name: "",
      email: email,
      consent: false,
      show_account_exists_error: false,
    };
    this.consentRef = React.createRef();
    this.emailInputRef = React.createRef();
    this.nameInputRef = React.createRef();

    this.axiosCancelToken = axios.CancelToken.source();
  }

  static propTypes = {
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
  };

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
    this.setState({
      show_account_exists_error: false,
    });
    const value = {
      name: this.state.name,
      email: this.state.email,
    };
    axios
      .post("/api/auth", value, {
        cancelToken: this.axiosCancelToken.token,
      })
      .catch(this.handleSubmitError)
      .then((res) => {
        if (res) {
          this.props.onLogin();
        } else {
          this.handleSubmitError(null);
        }
      });
  };

  handleSubmitError = (err) => {
    if (err.response) {
      if (err.response.status === HttpStatus.CONFLICT) {
        this.setState({
          show_account_exists_error: true,
        });
      } else {
        console.log(err.response);
      }
    }
  };

  render() {
    var email_error;
    if (this.state.show_account_exists_error) {
      email_error = (
        <Row className="my-2">
          <Col></Col>
          <Col className="red_text">
            Account with such email already exists.
          </Col>
          <Col>
            <Link
              to={{
                pathname: "/password-recover-request",
                state: { email: this.state.email },
              }}
            >
              Forgot your password?
            </Link>
          </Col>
        </Row>
      );
    }
    return (
      <Container>
        <Card className="border-0">
          <Card.Body className="p-3">
            <Card.Title>Sign up</Card.Title>
            <Form className="m-4" onSubmit={this.onSubmit}>
              <Row className="m-2">
                By continuing, you agree to our
                <Link to={"/terms-of-service"}>
                  &nbsp; Terms Of Service &nbsp;
                </Link>
                and
                <Link to={"/privacy-policy"}>&nbsp; Privacy Policy &nbsp;</Link>
              </Row>
              <Form.Group
                as={Row}
                className="m-2"
                controlId="formCustomerAggreementCheckbox"
              >
                <Form.Check
                  type="checkbox"
                  onChange={this.toggleConsent}
                  ref={this.consentRef}
                />
                <Form.Label sm="2">
                  I am aware that Mazed currently is under active development,
                  therefore there is no guarantie of any kind
                </Form.Label>
              </Form.Group>
              <Form.Group as={Row} controlId="formLoginName">
                <Form.Label column sm="2">
                  Name
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
              {email_error}
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
