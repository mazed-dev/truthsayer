import React from "react";

import {
  Card,
  Button,
  ButtonGroup,
  InputGroup,
  FormControl,
  Form,
  Container,
  Row,
  Col,
  CardColumns,
  DropdownButton,
  Dropdown,
} from "react-bootstrap";

class Signin extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: this.props.name,
      email: this.props.email,
      password: "",
      consent: false,
    };
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
    console.log(event);
    this.setState({ consent: !this.state.consent });
  };

  render() {
    const customer_agreement_checkbox_id = "customer-agreement-check";
    return (
      <Container>
        <Card className="border-0">
          <Card.Body className="p-3">
            <Card.Title>Creat an account</Card.Title>
            <Form className="m-4">
              <Form.Group as={Row} controlId="formLoginEmail">
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
                    placeholder="julius.caesar@rome.io"
                    value={this.state.email}
                    onChange={this.handleEmailChange}
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
                    placeholder="zx!y19%swd&"
                    value={this.state.password}
                    onChange={this.handlePasswordChange}
                  />
                </Col>
              </Form.Group>
              <Card.Text>
                This software is still under heavy active development, therefore
                there is guarantie of any kind. Check here to indicate that you
                understand potential risks of using it.
              </Card.Text>
              <Form.Group as={Row} controlId="formCustomerAggreementCheckbox">
                <Form.Label column></Form.Label>I understand
                <Col sm="2">
                  <Form.Check
                    type="checkbox"
                    id={customer_agreement_checkbox_id}
                    onChange={this.toggleConsent}
                  />
                </Col>
              </Form.Group>
              <Button variant="secondary" type="submit">
                Submit
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

export default Signin;
