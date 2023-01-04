import React from 'react'

import { Badge, Button, Card, Col, Container, Form, Row } from 'react-bootstrap'

import PropTypes from 'prop-types'
import { authentication } from 'smuggler-api'
import { withRouter } from 'react-router-dom'

class PasswordChange extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      password: '',
      new_password: '',
      confirm_new_password: '',
      is_ready: false,
      new_password_is_too_short: false,
      new_password_is_not_confirmed: false,
    }
    this.abortControler = new AbortController()
  }

  static propTypes = {
    history: PropTypes.object.isRequired,
  }

  componentWillUnmount() {
    this.abortControler.abort()
  }

  handlePasswordChange = (event) => {
    this.setState({ password: event.target.value })
  }

  handleNewPasswordChange = (event) => {
    this.setState({ new_password: event.target.value })
    this.verifyNewPassword(event.target.value, this.state.confirm_new_password)
  }

  handleConfirmNewPasswordChange = (event) => {
    this.setState({ confirm_new_password: event.target.value })
    this.verifyNewPassword(this.state.new_password, event.target.value)
  }

  verifyNewPassword = (new_password, confirm_new_password) => {
    const new_password_is_too_short = new_password.length < 6
    const new_password_is_not_confirmed = new_password !== confirm_new_password
    this.setState({
      new_password_is_too_short,
      new_password_is_not_confirmed,
      is_ready: !new_password_is_too_short && !new_password_is_not_confirmed,
    })
  }

  onSubmit = (event) => {
    event.preventDefault()
    authentication.user.password
      .change({
        old_password: this.state.password,
        new_password: this.state.new_password,
        signal: this.abortControler.signal,
      })
      .catch((err) => {
        alert(`Error ${err}`)
      })
      .then((res) => {
        if (res) {
          this.props.history.push('/login')
        }
      })
  }

  render() {
    let new_password_badge
    if (this.state.new_password_is_too_short) {
      new_password_badge = <Badge bg="danger">is too short</Badge>
    } else {
      new_password_badge = <Badge bg="success">ok</Badge>
    }
    let new_password_confirm_badge
    if (this.state.new_password_is_not_confirmed) {
      new_password_confirm_badge = <Badge bg="danger">doesn't match</Badge>
    } else {
      new_password_confirm_badge = <Badge bg="success">ok</Badge>
    }
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
                  New password &nbsp;
                  {new_password_badge}
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
                  Confirm new password &nbsp;
                  {new_password_confirm_badge}
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
    )
  }
}

export default withRouter(PasswordChange)
