/** @jsxImportSource @emotion/react */

import React from 'react'

import { useNavigate, useLocation } from 'react-router-dom'
import { css } from '@emotion/react'

import { Card, Button, Form, Container, Row, Col } from 'react-bootstrap'

import { goto, routes } from '../../lib/route'
import { NavigateFunction } from 'react-router-dom'

import { log } from 'armoury'

import { authentication } from 'smuggler-api'
import { Link } from 'react-router-dom'

type SignupProps = {
  navigate: NavigateFunction
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
    goto.goToInboxToConfirmEmail({
      navigate: this.props.navigate,
      state: {
        name: this.state.name,
        email: this.state.email,
      },
    })
  }

  onSubmit = (event: React.ChangeEvent<HTMLFormElement>) => {
    event.preventDefault()
    this.setState({
      errorMsg: undefined,
    })
    authentication.user
      .register({
        name: this.state.name,
        email: this.state.email,
        signal: this.abortControler.signal,
      })
      .then((res) => {
        if (res) {
          this.onSuccessfulRegistration()
        }
      }, this.handleSubmitError)
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
            <Link to={{ pathname: '/password-recover-request' }}>
              Forgot your password?
            </Link>
          </Col>
        </Row>
      )
    }
    return (
      <Container
        css={css`
          margin: 10vw auto auto auto;
        `}
      >
        <Card className="border-0">
          <Card.Body className="p-3">
            <Card.Title
              css={css`
                font-size: 48px;
                font-family: 'Comfortaa';
              `}
            >
              Sign up
            </Card.Title>
            <Form
              onSubmit={this.onSubmit}
              css={css`
                margin: 4vw auto auto auto;
              `}
            >
              <Row
                css={css`
                  margin-bottom: 24px;
                `}
              >
                By continuing, you agree to our
                <Link
                  to={routes.terms}
                  css={css`
                    width: auto;
                  `}
                >
                  Terms Of Service
                </Link>
                and
                <Link
                  to={routes.privacy}
                  css={css`
                    width: auto;
                  `}
                >
                  Privacy Policy
                </Link>
              </Row>
              <Form.Group
                as={Row}
                controlId="formLoginName"
                css={css`
                  margin-bottom: 1em;
                `}
              >
                <Form.Label column sm="1">
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
                <Form.Label column sm="1">
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
                css={css`
                  margin: 1rem auto auto auto;
                `}
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

export const Signup = () => {
  const navigate = useNavigate()
  const _location = useLocation()
  const email = _location.state?.email
  return <SignupImpl navigate={navigate} email={email} />
}
