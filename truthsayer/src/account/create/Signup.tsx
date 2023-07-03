/** @jsxImportSource @emotion/react */

import React from 'react'

import { useNavigate } from 'react-router-dom'
import { css } from '@emotion/react'
import styled from '@emotion/styled'

import { Card, Button, Form, Container } from 'react-bootstrap'

import { goto, routes } from '../../lib/route'

import { log } from 'armoury'

import { authentication } from 'smuggler-api'
import { Link } from 'react-router-dom'
import { truthsayer } from 'elementary'

const Box = styled(Container)`
  margin: 10vw auto auto auto;
  font-family: 'Noto Serif';
`

const FormLabel = styled.div`
  text-wrap: nowrap;
  margin: 0 1em 0 1em;
`
const FormRow = styled.div`
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 1em;
  @media (max-width: 500px) {
    flex-wrap: wrap;
  }
`
const Subtitle = styled.div`
  margin-top: 24px;
`
const TermsAndConditionsComment = styled.div`
  margin: 0 0 1em 0;
`
const FormInput = styled(Form.Control)`
  max-width: 600px;
`
const ErrorMessage = styled.div`
  color: red;
`

export function Signup() {
  const navigate = useNavigate()

  const [name, setName] = React.useState<string>('')
  const [email, setEmail] = React.useState<string>('')
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  const emailInputRef = React.useRef<HTMLInputElement>(null)
  const nameInputRef = React.useRef<HTMLInputElement>(null)
  const abortControllerRef = React.useRef(new AbortController())
  React.useEffect(() => {
    const ref = abortControllerRef
    return () => {
      ref.current.abort()
    }
  }, [])

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value)
  }

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value)
  }

  const isReadyToSubmit = () => {
    return name.length > 1 && emailInputRef.current?.validity.valid
  }

  const onSuccessfulRegistration = () => {
    goto.onboarding({ navigate })
  }

  const onSubmit = (event: React.ChangeEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMsg(null)
    authentication.user
      .register({
        name,
        email,
        signal: abortControllerRef.current.signal,
      })
      .then((res) => {
        if (res) {
          onSuccessfulRegistration()
        }
      }, handleSubmitError)
  }

  const handleSubmitError = (err: any) => {
    log.exception(err)
    setErrorMsg('Account with such email already exists. ')
  }

  let remoteErrorElement
  if (errorMsg != null) {
    remoteErrorElement = (
      <FormRow>
        <ErrorMessage>{errorMsg}</ErrorMessage>&nbsp;
        <Link to={{ pathname: '/password-recover-request' }}>
          Forgot your password?
        </Link>
      </FormRow>
    )
  }
  return (
    <Box>
      <Card className="border-0">
        <Card.Body className="p-3">
          <Card.Title
            css={css`
              font-size: 36px;
            `}
          >
            Create account
          </Card.Title>
          <Subtitle>
            or{' '}
            <a href={truthsayer.url.make({ pathname: '/login' }).href}>
              sign in
            </a>{' '}
            to your Foreword account
          </Subtitle>
          <Form
            onSubmit={onSubmit}
            css={css`
              margin: 4vw auto auto auto;
            `}
          >
            <Form.Group as={FormRow} controlId="formLoginName">
              <FormLabel>Name</FormLabel>
              <FormInput
                type="name"
                placeholder="Gaius Julius Caesar"
                value={name}
                onChange={handleNameChange}
                ref={nameInputRef}
              />
            </Form.Group>
            <Form.Group as={FormRow} controlId="formLoginEmail">
              <FormLabel>Email</FormLabel>
              <FormInput
                type="email"
                value={email}
                onChange={handleEmailChange}
                ref={emailInputRef}
              />
            </Form.Group>
            {remoteErrorElement}
            <FormRow>
              <Button
                variant="secondary"
                type="submit"
                disabled={!isReadyToSubmit()}
                css={css`
                  margin: 0 0 0 1em;
                `}
              >
                Register
              </Button>
            </FormRow>
            <TermsAndConditionsComment>
              By continuing, you agree to our{' '}
              <Link
                to={routes.terms}
                css={css`
                  width: auto;
                `}
              >
                Terms&nbsp;Of&nbsp;Service
              </Link>
              {' and '}
              <Link
                to={routes.privacy}
                css={css`
                  width: auto;
                `}
              >
                Privacy&nbsp;Policy
              </Link>
            </TermsAndConditionsComment>
          </Form>
        </Card.Body>
      </Card>
    </Box>
  )
}
