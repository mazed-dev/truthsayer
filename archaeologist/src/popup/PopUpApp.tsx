import React from 'react'
import { useAsyncEffect } from 'use-async-effect'

import styled from '@emotion/styled'
import { PostHog } from 'posthog-js'

import { FromPopUp, ToPopUp } from './../message/types'
import { ViewActiveTabStatus } from './ViewActiveTabStatus'
import {
  ErrorBox,
  LoginForm,
  Spinner,
  userFacingLoginErrorFrom,
} from 'elementary'
import { productanalytics } from 'armoury'
import type { AnalyticsIdentity } from 'armoury'
import { PopUpContext } from './context'
import type {
  ForwardToRealImpl,
  SessionCreateArgs,
  StorageApiMsgPayload,
  StorageApiMsgReturnValue,
} from 'smuggler-api'
import { makeMsgProxyStorageApi } from 'smuggler-api'
import { renderUserFacingError } from './userFacingError'

const AppContainer = styled.div`
  width: 340px;
  height: 480px;
  font-family: 'Roboto', arial, sans-serif;
  font-style: normal;
  font-weight: 400;
`

const Centered = styled.div`
  margin: 0 auto 0 auto;
  display: flex;
  justify-content: center;
`

type State =
  | { type: 'not-init' }
  | { type: 'error'; error: string }
  | { type: 'not-logged-in'; analytics?: PostHog }
  | { type: 'logged-in'; userUid: string; analytics?: PostHog }

type Action =
  | ToPopUp.AppStatusResponse
  | ToPopUp.LogInResponse
  | { type: 'mark-as-errored'; error: string }

function updateState(state: State, action: Action): State {
  switch (action.type) {
    case 'APP_STATUS_RESPONSE': {
      if (state.type !== 'not-init') {
        throw new Error(
          `Tried to do first-time init of popup app, but it already has state '${state.type}'`
        )
      }
      const analytics = makeAnalytics(action.analyticsIdentity)
      if (action.userUid == null) {
        return { type: 'not-logged-in', analytics }
      }
      return { type: 'logged-in', userUid: action.userUid, analytics }
    }
    case 'RESPONSE_LOG_IN': {
      if (state.type !== 'not-logged-in') {
        throw new Error(
          `Tried to log in, but popup app is in state '${state.type}'`
        )
      }
      return {
        type: 'logged-in',
        userUid: action.user.uid,
        analytics: state.analytics,
      }
    }
    case 'mark-as-errored': {
      if (state.type !== 'not-init') {
        throw new Error(
          `Tried to do mark popup app init as failed, but it has unexpected state '${state.type}'`
        )
      }
      return {
        type: 'error',
        error: action.error,
      }
    }
  }
}

function makeAnalytics(
  analyticsIdentity: AnalyticsIdentity
): PostHog | undefined {
  return (
    productanalytics.make('archaeologist/popup', process.env.NODE_ENV, {
      bootstrap: {
        distinctID: analyticsIdentity.analyticsIdentity,
        isIdentifiedID: true,
      },
    }) ?? undefined
  )
}

export const PopUpApp = () => {
  const initialState: State = { type: 'not-init' }
  const [state, dispatch] = React.useReducer(updateState, initialState)

  useAsyncEffect(async () => {
    try {
      const response = await FromPopUp.sendMessage({
        type: 'REQUEST_APP_STATUS',
      })
      dispatch(response)
    } catch (e) {
      dispatch({
        type: 'mark-as-errored',
        error: renderUserFacingError({
          failedTo: 'detect its web extension',
          tryTo: 're-open this popup',
        }),
      })
    }
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
        value={{
          storage: makeMsgProxyStorageApi(forwardToBackground),
          analytics: analyticsFrom(state),
        }}
      >
        {determineWidget(state, dispatch)}
      </PopUpContext.Provider>
    </AppContainer>
  )
}

function determineWidget(state: State, dispatch: React.Dispatch<Action>) {
  switch (state.type) {
    case 'not-init': {
      return (
        <Centered>
          <Spinner.Wheel />
        </Centered>
      )
    }
    case 'error': {
      return <ErrorBox>{state.error}</ErrorBox>
    }
    case 'not-logged-in': {
      return <LoginPage onLogin={dispatch} />
    }
    case 'logged-in': {
      return <ViewActiveTabStatus />
    }
  }
}

function analyticsFrom(state: State): PostHog | undefined {
  switch (state.type) {
    case 'not-init':
    case 'error': {
      return undefined
    }
    case 'not-logged-in':
    case 'logged-in': {
      return state.analytics
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
        setState({ type: 'error', message: userFacingLoginErrorFrom(reason) })
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
