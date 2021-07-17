import React from 'react'

import { Card, Button, Form, Container, Row, Col } from 'react-bootstrap'

import PropTypes from 'prop-types'
import { withRouter } from 'react-router-dom'

import { smugler } from '../smugler/api'

class PasswordRecoverForm extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      password: '',
      isReady: false,
      is_validating: true,
    }
    this.cancelToken = smugler.makeCancelToken()
  }

  static propTypes = {
    history: PropTypes.object.isRequired,
  }

  componentWillUnmount() {
    this.cancelToken.cancel()
  }

  handlePasswordChange = (event) => {
    const isReady = event.target.value.length > 6
    this.setState({
      password: event.target.value,
      isReady,
    })
  }

  onSubmit = (event) => {
    event.preventDefault()
    const value = {
      token: this.props.token,
      new_password: this.state.password,
    }
    smugler.user.password
      .reset({
        token: this.props.token,
        new_password: this.state.password,
        cancelToken: this.cancelToken.token,
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
    )
  }
}

export default withRouter(PasswordRecoverForm)
