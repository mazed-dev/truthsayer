import React from "react";

import { Button, Container, Form } from "react-bootstrap";

class Login extends React.Component {
  componentDidMount() {
    document.cookie =
      "11171360-122222-126543-026543-103335-071075-144001-117335-136560";
  }

  render() {
    return (
      <Container className="meta-in-center">
        <Form className="m-4">
          <Form.Group controlId="formLoginEmail">
            <Form.Control type="email" placeholder="email" />
          </Form.Group>

          <Form.Group controlId="formLoginPassword">
            <Form.Control type="password" placeholder="password" />
          </Form.Group>
          <Button variant="secondary" type="submit">
            Submit
          </Button>
        </Form>
      </Container>
    );
  }
}

export default Login;
