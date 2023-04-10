import React from 'react'

import styled from '@emotion/styled'
import { Form, Button } from 'react-bootstrap'

import { isSmugglerError } from 'smuggler-api'

const LoginFormBox = styled(Form)`
  display: flex;
  align-content: flex-start;
  align-items: center;
  flex-direction: column;
  justify-content: center;
`

const LoginFormRow = styled.div`
  margin: 6px;
  display: flex;
  flex-direction: column;
`
const LoginFormLabel = styled.div``
const Title = styled.h1`
  font-family: 'Comfortaa';
  font-size: 24px;
  margin-bottom: 20px;
`
export const LoginForm = ({
  onSubmit,
  className,
  disabled,
}: {
  onSubmit: (email: string, password: string) => Promise<void>
  className?: string
  disabled?: boolean
}) => {
  const [email, setEmail] = React.useState<string>('')
  const [password, setPassword] = React.useState<string>('')
  const onSubmit_ = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      onSubmit(email, password)
    },
    [email, password]
  )
  return (
    <LoginFormBox onSubmit={onSubmit_} className={className}>
      <Title>Mazed</Title>
      <Form.Group as={LoginFormRow} controlId="formLoginEmail">
        <LoginFormLabel>Email</LoginFormLabel>
        <Form.Control
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </Form.Group>
      <Form.Group as={LoginFormRow} controlId="formLoginPassword">
        <LoginFormLabel>Password</LoginFormLabel>
        <Form.Control
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </Form.Group>
      <LoginFormRow>
        <Button type="submit" disabled={disabled ?? false}>
          Log in
        </Button>
      </LoginFormRow>
    </LoginFormBox>
  )
}

/**
 * Given an error thrown during smuggler-api.session.create(),
 * return a user-facing error message.
 */
export function userFacingLoginErrorFrom(err: any): string {
  const defaultError = 'Unknown error occured, please try again'
  const invalidPasswordError = 'Invalid email or password'
  const accountNotActivatedYet = 'Account has not been activated yet'
  if (!isSmugglerError(err)) {
    // Even if an exception is thrown as `SmugglerError`, if it travels through
    // the messaging boundary of a web extension, webextension-polyfill
    // will suppress basic context of this error such as `Error.name`,
    // see https://github.com/mozilla/webextension-polyfill/blob/9398f8cc20ed7e1cc2b475180ed1bc4dee2ebae5/src/browser-polyfill.js#L482-L488
    // So it's not easy to figure out what kind of error it is.
    // As a fallback, check the error message directly for likely patterns
    //
    // TODO[snikitin@outlook.com] Experiment with packing errors into Error.message
    // as JSON before they travel through the messaging boundary. Unpacking on the receiving
    // end can help avoid these hacks.
    const isString = (x: any): x is string => typeof x === 'string'
    if ('message' in err) {
      const message = err.message
      const lowercase = isString(message) ? message : ''
      if (lowercase.includes('401')) {
        return invalidPasswordError
      } else if (lowercase.includes('403')) {
        return accountNotActivatedYet
      }
    }
    return defaultError
  }
  switch (err.status) {
    case 401:
      return invalidPasswordError
    case 403:
      return 'Account has not been activated yet'
    default:
      return defaultError
  }
}
