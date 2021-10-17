import React from 'react'

import { Card, Button, Form, Container, Row, Col } from 'react-bootstrap'

import PropTypes from 'prop-types'
import { withRouter, Link } from 'react-router-dom'

import { smuggler } from 'smuggler-api'
import { goto } from '../lib/route'

import './Signup.css'

class Login extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      email: this.props.email,
      password: '',
      isReady: false,
      server_error: null,
    }
    this.emailRef = React.createRef()
    this.createSessionCancelToken = smuggler.makeCancelToken()
  }

  static propTypes = {
    history: PropTypes.object.isRequired,
  }

  componentWillUnmount() {
    this.createSessionCancelToken.cancel()
  }

  handleEmailChange = (event) => {
    this.setState({ email: event.target.value })
    this.checkState()
  }

  handlePasswordChange = (event) => {
    this.setState({ password: event.target.value })
    this.checkState()
  }

  checkState = () => {
    const isReady = this.emailRef.current.validity.valid
    this.setState({ isReady })
  }

  onSubmit = (event) => {
    event.preventDefault()
    this.setState({
      server_error: null,
    })
    smuggler.session
      .create({
        email: this.state.email,
        password: this.state.password,
        cancelToken: this.createSessionCancelToken.token,
      })
      .catch(this.handleSubmitError)
      .then((res) => {
        if (res) {
          goto.default({}) // { history: this.props.history });
        } else {
          goto.notice.error({ history: this.props.history })
        }
      })
  }

  handleSubmitError = (err) => {
    // *dbg*/ console.log('Server error ', err)
    if (err && err.response) {
      // if (err.response.status === HttpStatus.FORBIDDEN) {
      if (err.response.data && err.response.data.message) {
        this.setState({
          server_error: err.response.data.message,
        })
      } else {
        this.setState({
          server_error: err.response.stringify(),
        })
      }
    } else {
      this.setState({
        server_error: 'Server error',
      })
    }
  }

  render() {
    let server_error
    if (this.state.server_error) {
      server_error = <p className="red_text">{this.state.server_error}</p>
    }
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
              <Row>
                <Col />
                <Col>
                  <Button
                    variant="secondary"
                    type="submit"
                    disabled={!this.state.isReady}
                  >
                    Log in
                  </Button>
                  <Button variant="secondary" as={Link} to="/signup">
                    Sign up
                  </Button>
                </Col>
                <Col>{server_error}</Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    )
  }
}

Login.defaultProps = {
  email: '',
}

export default withRouter(Login)
