/** @jsxImportSource @emotion/react */

import React from 'react'

import styled from '@emotion/styled'

import { authentication } from 'smuggler-api'
import { goto } from '../lib/route'
import {
  ErrorBox,
  LoginForm,
  Spinner,
  userFacingLoginErrorFrom,
} from 'elementary'
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
  margin-bottom: 10vh;
`

export const Login = () => {
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setLoading] = React.useState<boolean>(false)
  const onSubmit = React.useCallback(
    async (email: string, password: string) => {
      setLoading(true)
      setError(null)
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
