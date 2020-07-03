import React from "react";

import {
  Col,
  Form,
  InputGroup,
  Card,
  Button,
  Container,
  ButtonGroup,
  ListGroup,
} from "react-bootstrap";

import { withRouter } from "react-router-dom";

import "./WelcomePage.css";

class SignUpImpl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
    };
  }

  handleEmailChange = (event) => {
    this.setState({ email: event.target.value });
  };

  onSubmit = (event) => {
    event.preventDefault();
    this.props.history.push("/signup", {
      email: this.state.email,
    });
  };

  render() {
    return (
      <Form className="m-4" onSubmit={this.onSubmit}>
        <InputGroup className="w-50 m-4">
          <Form.Control
            type="email"
            value={this.state.email}
            onChange={this.handleEmailChange}
          />
          <InputGroup.Append>
            <Button variant="secondary" type="submit">
              Sign up
            </Button>
          </InputGroup.Append>
        </InputGroup>
      </Form>
    );
  }
}

const SignUp = withRouter(SignUpImpl);

function WelcomePage() {
  // <h3>Link up your ideas</h3>
  // <h3>Organize your knowledge</h3>
  // <h3>Line up your memories</h3>
  return (
    <Container>
      <Container className="mazed_title_block">
        <h1>Link up your ideas</h1>
        <h2 className="mazed_subtitle">
          they were here the whole time, all you need is a quick access
        </h2>
      </Container>
      <SignUp />
      <p></p>
    </Container>
  );
}

export default WelcomePage;
