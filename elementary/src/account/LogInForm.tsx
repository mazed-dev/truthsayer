import React from 'react'

import styled from '@emotion/styled'
import { Form, Button } from 'react-bootstrap'

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
