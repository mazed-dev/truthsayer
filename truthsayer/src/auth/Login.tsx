/** @jsxImportSource @emotion/react */

import React from 'react'

import styled from '@emotion/styled'

import { useHistory } from 'react-router-dom'

import { authentication } from 'smuggler-api'
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
  const [serverError, setServerError] = React.useState<string | null>(null)
  const [isLoading, setLoading] = React.useState<boolean>(false)
  const history = useHistory()
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
        // *dbg*/ console.log('Server error ', err)
        if (err && err.response) {
          // if (err.response.status === HttpStatus.FORBIDDEN) {
          if (err.response.data && err.response.data.message) {
            setServerError(err.response.data.message)
          } else {
            setServerError(err.response.stringify())
          }
        } else {
          setServerError('Server error')
        }
        goto.notice.error({ history: history })
      }
      try {
        await FromTruthsayer.sendMessage({
          type: 'CHECK_AUTHORISATION_STATUS_REQUEST',
        })
      } catch (err) {
        log.debug('Sending message to Archaeologist failed', err)
      }
      // Redirect to default on success and failure, because Archaeologist
      // might be not yet installed
      goto.default({})
    },
    [history]
  )

  return (
    <LoginCardBox>
      <TruthsayerLoginForm onSubmit={onSubmit} disabled={isLoading} />
      <ErrorBox>{serverError}</ErrorBox>
      {isLoading === true ? <Spinner.Wheel /> : null}
    </LoginCardBox>
  )
}
