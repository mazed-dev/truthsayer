import React from 'react'

import {
  Card,
  Button,
  Form,
  Container,
  Row,
  Col,
  ButtonGroup,
} from 'react-bootstrap'

import { Emoji } from './../lib/Emoji'
import PropTypes from 'prop-types'
import { authentication } from 'smuggler-api'
import { withRouter } from 'react-router-dom'

class PasswordRecoverRequest extends React.Component {
  constructor(props) {
    super(props)
    let email = ''
    if (this.props.location.state && this.props.location.state.email) {
      email = this.props.location.state.email
    }
    this.state = {
      email,
      reset_request_is_sent: false,
    }
    this.emailRef = React.createRef()
    this.abortControler = new AbortController()
  }

  static propTypes = {
    history: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
  }

  componentDidMount() {
    // Just in case we are already logged in
    // TODO(akindyakov): Check that user is logged in here
    // axios
    //   .get('/api/auth/session', {
    //     signal: this.abortControler.signal,
    //   })
    //   .then((res) => {
    //     if (res) {
    //       this.props.history.push('/')
    //     }
    //   })
  }

  componentWillUnmount() {
    this.abortControler.abort()
  }

  handleEmailChange = (event) => {
    this.setState({ email: event.target.value })
    this.checkState()
  }

  checkState = () => {
    if (this.emailRef.current) {
      const isReady = this.emailRef.current.validity.valid
      this.setState({ isReady })
    }
  }

  onSubmit = (event) => {
    event.preventDefault()
    authentication.user.password
      .recover({
        email: this.state.email,
        signal: this.abortControler.signal,
      })
      .catch((err) => {
        alert(`Error ${err}`)
      })
      .then((res) => {
        if (res) {
          this.setState({
            reset_request_is_sent: true,
          })
        }
      })
  }

  onGoBackToMain = () => {
    this.props.history.push('/')
  }

  render() {
    let show
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
      )
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
      )
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
    )
  }
}

export default withRouter(PasswordRecoverRequest)
