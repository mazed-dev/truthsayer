import React from 'react'
import { useAsyncEffect } from 'use-async-effect'

import styled from '@emotion/styled'
import { PostHog } from 'posthog-js'

import { FromPopUp, ToPopUp } from './../message/types'
import { ViewActiveTabStatus } from './ViewActiveTabStatus'
import { LoginForm, Spinner } from 'elementary'
import { errorise, productanalytics } from 'armoury'
import type { AnalyticsIdentity } from 'armoury'
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

type State = 
 | { type: 'not-init'} 
 | {type: 'not-logged-in', analyticsIdentity: AnalyticsIdentity}
 | {type: 'logged-in', userUid: string, analyticsIdentity: AnalyticsIdentity, analytics?: PostHog}

type Action = ToPopUp.AppStatusResponse | ToPopUp.LogInResponse

function updateState(state: State, action: Action): State {
  switch (action.type) {
    case 'APP_STATUS_RESPONSE': {
      if (state.type !== 'not-init') {
        throw new Error(`Tried to do first-time init of popup app, but it already has state '${state.type}'`)
      }
      if (action.userUid == null) {
        return {type: 'not-logged-in', analyticsIdentity: action.analyticsIdentity}
      }
      return {
        type: 'logged-in',
        userUid: action.userUid,
        analyticsIdentity: action.analyticsIdentity,
        analytics: makeAnalytics(action.analyticsIdentity),
      }
    }
    case 'RESPONSE_LOG_IN': {
      if (state.type !== 'not-logged-in') {
        throw new Error(`Tried to log in, but popup app is in state '${state.type}'`)
      }
      return {
        type: 'logged-in',
        userUid: action.user.uid,
        analyticsIdentity: state.analyticsIdentity,
        analytics: makeAnalytics(state.analyticsIdentity),
      }

    }
  }
}

function makeAnalytics(analyticsIdentity: AnalyticsIdentity): PostHog | undefined {
  return (
    productanalytics.make('archaeologist/popup', process.env.NODE_ENV, {
      bootstrap: {
        distinctID: analyticsIdentity.analyticsIdentity,
        isIdentifiedID: true,
      }
    }) ??
    undefined
  )
}

export const PopUpApp = () => {
  const initialState: State = {type: 'not-init'}
  const [state, dispatch] = React.useReducer(updateState, initialState)

  useAsyncEffect(async () => {
    const response = await FromPopUp.sendMessage({
      type: 'REQUEST_APP_STATUS',
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
      {determineWidget(state, dispatch)}
      </PopUpContext.Provider>
    </AppContainer>
  )
}

function determineWidget(state: State, dispatch: React.Dispatch<Action>) {
  switch (state.type) {
    case 'not-init': {
      return <Spinner.Ring />
    }
    case 'not-logged-in': {
      return <LoginPage onLogin={dispatch} />
    }
    case 'logged-in': {
      return <ViewActiveTabStatus />
    }
  }
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

type LoginPageState =
  | { type: 'awaiting-input' }
  | { type: 'logging-in' }
  | { type: 'error'; message: string }
  | { type: 'logged-in' }

const LoginPage = ({
  onLogin,
}: {
  onLogin: (response: ToPopUp.LogInResponse) => void
}) => {
  const [state, setState] = React.useState<LoginPageState>({
    type: 'awaiting-input',
  })
  const onSubmit = React.useCallback(
    async (email: string, password: string) => {
      if (state.type === 'logged-in' || state.type === 'logging-in') {
        throw new Error(
          `Tried to log in, but the state is already '${state.type}'`
        )
      }
      setState({ type: 'logging-in' })
      const args: SessionCreateArgs = {
        email: email,
        password: password,
        permissions: null,
      }
      try {
        const response = await FromPopUp.sendMessage({
          type: 'REQUEST_TO_LOG_IN',
          args,
        })
        setState({ type: 'logged-in' })
        onLogin(response)
      } catch (reason) {
        setState({ type: 'error', message: errorise(reason).message })
      }
    },
    [state.type, setState, onLogin]
  )

  const determineWidget = (state: LoginPageState) => {
    const input = <LoginFormForPopUp onSubmit={onSubmit} />
    switch (state.type) {
      case 'awaiting-input': {
        return input
      }
      case 'logging-in': {
        return <Spinner.Ring />
      }
      case 'error': {
        return (
          <>
            {input}
            <ErrorBox>{state.message}</ErrorBox>
          </>
        )
      }
      case 'logged-in': {
        return <>Logged in ✅</>
      }
    }
  }

  return (
    <LoginPageBox>
      <LoginImageBox>
        <LogoImg src="/logo-128x128.png" />
      </LoginImageBox>
      <LoginFormBox>{determineWidget(state)}</LoginFormBox>
    </LoginPageBox>
  )
}

export default PopUpApp
