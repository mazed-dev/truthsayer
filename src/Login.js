import React from "react";

import { Button, Container, Form } from "react-bootstrap";

function Login() {
  return (
    <Container className="meta-in-center">
      <Form>
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

export default Login;
