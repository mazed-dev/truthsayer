import React from 'react'
import { useAsyncEffect } from 'use-async-effect'

import styled from '@emotion/styled'
import { PostHog } from 'posthog-js'

import { FromPopUp, ToPopUp } from './../message/types'
import { ViewActiveTabStatus } from './ViewActiveTabStatus'
import { LoginForm } from 'elementary'
import { errorise, productanalytics } from 'armoury'
import { PopUpContext } from './context'
import type {
  ForwardToRealImpl,
  SessionCreateArgs,
  StorageApiMsgPayload,
  StorageApiMsgReturnValue,
} from 'smuggler-api'
import { makeMsgProxyStorageApi } from 'smuggler-api'

const AppContainer = styled.div`
  width: 340px;
  height: 480px;
  font-family: 'Roboto', arial, sans-serif;
  font-style: normal;
  font-weight: 400;
`

type State = {
  userUid?: string
  analytics?: PostHog
}

type Action = ToPopUp.AuthStatusResponse

function updateState(_: State, action: Action): State {
  switch (action.type) {
    case 'AUTH_STATUS': {
      if (action.userUid == null) {
        return {}
      }
      const analytics: PostHog | undefined =
        productanalytics.make(
          'archaeologist/popup',
          process.env.NODE_ENV,
          {}
        ) ?? undefined
      return {
        userUid: action.userUid,
        analytics,
      }
    }
  }
}

export const PopUpApp = () => {
  const initialState: State = {}
  const [state, dispatch] = React.useReducer(updateState, initialState)

  useAsyncEffect(async () => {
    const response = await FromPopUp.sendMessage({
      type: 'REQUEST_AUTH_STATUS',
    })
    dispatch(response)
  }, [])

  const forwardToBackground: ForwardToRealImpl = async (
    payload: StorageApiMsgPayload
  ): Promise<StorageApiMsgReturnValue> => {
    const response = await FromPopUp.sendMessage({
      type: 'MSG_PROXY_STORAGE_ACCESS_REQUEST',
      payload,
    })
    return response.value
  }
  return (
    <AppContainer>
      <PopUpContext.Provider
        value={{ storage: makeMsgProxyStorageApi(forwardToBackground) }}
      >
        {state.userUid == null ? <LoginPage /> : <ViewActiveTabStatus />}
      </PopUpContext.Provider>
    </AppContainer>
  )
}

const LogoImg = styled.img`
  margin-left: auto;
  margin-right: auto;
  margin: 12px;
`

const LoginPageBox = styled.div``
const LoginImageBox = styled.div`
  margin: 42px auto 0 auto;
  display: flex;
  justify-content: center;
`

const ErrorBox = styled.div`
  color: red;
`

const LoginFormBox = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
`
const LoginFormForPopUp = styled(LoginForm)``

const LoginPage = () => {
  const [error, setError] = React.useState<string | null>(null)
  const onSubmit = React.useCallback(
    async (email: string, password: string) => {
      const args: SessionCreateArgs = {
        email: email,
        password: password,
        permissions: null,
      }
      setError(null)
      FromPopUp.sendMessage({
        type: 'REQUEST_TO_LOG_IN',
        args,
      }).catch((reason) => {
        setError(errorise(reason).message)
      })
    },
    [setError]
  )

  return (
    <LoginPageBox>
      <LoginImageBox>
        <LogoImg src="/logo-128x128.png" />
      </LoginImageBox>
      <LoginFormBox>
        <LoginFormForPopUp onSubmit={onSubmit} />
      </LoginFormBox>
      <ErrorBox>{error}</ErrorBox>
    </LoginPageBox>
  )
}

export default PopUpApp
