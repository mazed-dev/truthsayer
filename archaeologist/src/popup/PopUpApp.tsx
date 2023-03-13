import React from 'react'
import { useAsyncEffect } from 'use-async-effect'

import browser from 'webextension-polyfill'

import styled from '@emotion/styled'
import { css } from '@emotion/react'
import { PostHog } from 'posthog-js'
import { Form, Row, Col } from 'react-bootstrap'

import { FromPopUp, ToPopUp } from './../message/types'
import { ViewActiveTabStatus } from './ViewActiveTabStatus'
import { Button } from './Button'
import { MdiLaunch, truthsayer } from 'elementary'
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

type LoginPageState = {
  email: string
  password: string
  error?: string
}

const LoginPage = () => {
  const [state, setState] = React.useState<LoginPageState>({
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
    <LoginPageBox>
      <LoginImageBox>
        <LogoImg src="/logo-128x128.png" />
      </LoginImageBox>

      <Form className="m-4" onSubmit={onSubmit}>
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
      </Form>
    </LoginPageBox>
  )
}

export default PopUpApp
