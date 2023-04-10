/** @jsxImportSource @emotion/react */

import React from 'react'

import styled from '@emotion/styled'

import { authentication, SmugglerError } from 'smuggler-api'
import { goto } from '../lib/route'
import { LoginForm, Spinner } from 'elementary'
import { FromTruthsayer } from 'truthsayer-archaeologist-communication'
import { log } from 'armoury'

const LoginCardBox = styled.div`
  border: 0;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: center;
  height: 80vh;
`

const TruthsayerLoginForm = styled(LoginForm)`
  margin-top: 22px;
`
const ErrorBox = styled.div`
  color: red;
`
export const Login = () => {
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setLoading] = React.useState<boolean>(false)
  const onSubmit = React.useCallback(
    async (email: string, password: string) => {
      setLoading(true)
      const permissions = null
      try {
        await authentication.session.create({
          email,
          password,
          permissions,
        })
      } catch (err) {
        setError(userFacingLoginErrorFrom(err))
        setLoading(false)
        return
      }
      try {
        await FromTruthsayer.sendMessage({
          type: 'CHECK_AUTHORISATION_STATUS_REQUEST',
        })
      } catch (err) {
        log.debug('Sending message to Archaeologist failed', err)
      }
      setLoading(false)
      // Redirect to default on success and failure, because Archaeologist
      // might be not yet installed
      goto.default({})
    },
    []
  )

  return (
    <LoginCardBox>
      <TruthsayerLoginForm onSubmit={onSubmit} disabled={isLoading} />
      <ErrorBox>{error}</ErrorBox>
      {isLoading === true ? <Spinner.Wheel /> : null}
    </LoginCardBox>
  )
}

function userFacingLoginErrorFrom(err: any): string {
  const defaultError = 'Unknown error occured, please try again'
  if (err! instanceof SmugglerError) {
    return defaultError
  }
  switch (err.status) {
    case 401:
      return 'Invalid email or password'
    case 403:
      return 'Account has not been activated yet'
    default:
      return defaultError
  }
}
