import React from 'react'

import styled from '@emotion/styled'
import { css } from '@emotion/react'
import { Form, Row, Col } from 'react-bootstrap'
import { MdiLaunch } from '../MaterialIcons'

const LoginFormBox = styled(Form)``
const LoginImageBox = styled.div`
  margin: 42px auto 0 auto;
  display: flex;
  justify-content: center;
`

type LoginFormState = {
  email: string
  password: string
  error?: string
}

export const LoginForm = () => {
  const [state, setState] = React.useState<LoginFormState>({
    email: '',
    password: '',
  })
  const onSignUp = () => {
    browser.tabs.create({
      url: truthsayer.url.make({ pathname: '/signup' }).toString(),
    })
  }
  const onSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const args: SessionCreateArgs = {
        email: state.email,
        password: state.password,
        permissions: null,
      }
      setState({ ...state, error: undefined })
      FromPopUp.sendMessage({
        type: 'REQUEST_TO_LOG_IN',
        args,
      }).catch((reason) => {
        setState({ ...state, error: errorise(reason).message })
      })
    },
    [state]
  )

  return (
      <LoginFormBox onSubmit={onSubmit}>
        <Form.Group as={Row} controlId="formLoginEmail">
          <Form.Label column sm="2">
            Email
          </Form.Label>
          <Col>
            <Form.Control
              type="email"
              value={state.email}
              onChange={(event) =>
                setState({ ...state, email: event.target.value })
              }
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
              value={state.password}
              onChange={(event) =>
                setState({ ...state, password: event.target.value })
              }
            />
          </Col>
        </Form.Group>
        <Row>
          <Col />
          <Col>
            <Button type="submit">Log in</Button>
            <Button onClick={onSignUp}>
              Sign up{' '}
              <MdiLaunch
                css={css`
                  vertical-align: middle;
                `}
              />
            </Button>
          </Col>
          {state.error != null ? <Col>{state.error}</Col> : null}
        </Row>
      </LoginFormBox>
  )
}
