/** @jsxImportSource @emotion/react */

import React from 'react'

import { useHistory, useLocation } from 'react-router-dom'

import { Card, Button, Form, Container, Row, Col } from 'react-bootstrap'

import { goto, History } from '../lib/route.js'

import { log } from 'armoury'

import { smuggler } from 'smuggler-api'
import { Link } from 'react-router-dom'
import HttpStatus from 'http-status-codes'

type SignupProps = {
  history: History
  email?: string
}

type SignupState = {
  name: string
  email: string
  consent: boolean
  errorMsg?: string
}

class SignupImpl extends React.Component<SignupProps, SignupState> {
  consentRef: React.RefObject<HTMLInputElement>
  emailInputRef: React.RefObject<HTMLInputElement>
  nameInputRef: React.RefObject<HTMLInputElement>
  abortControler: AbortController

  constructor(props: SignupProps) {
    super(props)
    const email = props?.email || ''
    this.state = {
      name: '',
      email,
      consent: false,
      errorMsg: undefined,
    }
    this.consentRef = React.createRef()
    this.emailInputRef = React.createRef()
    this.nameInputRef = React.createRef()

    this.abortControler = new AbortController()
  }

  componentDidMount() {
    this.nameInputRef.current?.focus()
  }

  componentWillUnmount() {
    this.abortControler.abort()
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ name: event.target.value })
  }

  handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ email: event.target.value })
  }

  toggleConsent = (_event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ consent: this.consentRef.current?.checked || false })
  }

  isReadyToSubmit = () => {
    const isReady =
      (this.state.consent &&
        this.state.name.length > 1 &&
        this.emailInputRef.current?.validity.valid) ||
      true
    return isReady
  }

  onSuccessfulRegistration = () => {
    goto.waitingForApproval(this.props.history, {
      username: this.state.name,
    })
  }

  onSubmit = (event: React.ChangeEvent<HTMLFormElement>) => {
    event.preventDefault()
    this.setState({
      errorMsg: undefined,
    })
    smuggler.user
      .register({
        name: this.state.name,
        email: this.state.email,
        signal: this.abortControler.signal,
      })
      .catch(this.handleSubmitError)
      .then((res) => {
        if (res) {
          this.onSuccessfulRegistration()
        }
      })
  }

  handleSubmitError = (err: any) => {
    log.exception(err)
    this.setState({
      errorMsg: 'Account with such email already exists',
    })
  }

  render() {
    let remoteErrorElement
    if (this.state.errorMsg) {
      remoteErrorElement = (
        <Row className="my-2">
          <Col />
          <Col
            css={{
              color: 'red',
            }}
          >
            {this.state.errorMsg}
          </Col>
          <Col>
            <Link
              to={{
                pathname: '/password-recover-request',
                state: { email: this.state.email },
              }}
            >
              Forgot your password?
            </Link>
          </Col>
        </Row>
      )
    }
    return (
      <Container>
        <Card className="border-0">
          <Card.Body className="p-3">
            <Card.Title>Sign up</Card.Title>
            <Form className="m-4" onSubmit={this.onSubmit}>
              <Row className="m-2">
                By continuing, you agree to our
                <Link to={'/terms-of-service'}>
                  &nbsp; Terms Of Service &nbsp;
                </Link>
                and
                <Link to={'/privacy-policy'}>&nbsp; Privacy Policy &nbsp;</Link>
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
                <Form.Label>
                  I am aware that Mazed currently is under active development,
                  therefore there are no guarantees of any kind
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
              {remoteErrorElement}
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
    )
  }
}

interface LocationState {
  email: string
}

export const Signup = ({}: {}) => {
  const history = useHistory()
  const _location = useLocation<LocationState>()
  const email = _location.state?.email
  return <SignupImpl history={history} email={email} />
}
