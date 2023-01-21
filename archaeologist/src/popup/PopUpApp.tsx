import React from 'react'
import { useAsyncEffect } from 'use-async-effect'

import browser from 'webextension-polyfill'

import styled from '@emotion/styled'
import { css } from '@emotion/react'
import { PostHog } from 'posthog-js'
import type { PostHogConfig } from 'posthog-js'

import { FromPopUp, ToPopUp } from './../message/types'
import { ViewActiveTabStatus } from './ViewActiveTabStatus'
import { Button } from './Button'
import { MdiLaunch, truthsayer } from 'elementary'
import { productanalytics } from 'armoury'
import { PopUpContext } from './context'
import { makeDatacenterStorageApi } from 'smuggler-api'

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
      const analyticsConfig: Partial<PostHogConfig> = {
        bootstrap: {
          distinctID: productanalytics.identity.fromUserId(
            action.userUid,
            process.env.NODE_ENV
          ),
          isIdentifiedID: true,
        },
      }
      const analytics: PostHog | undefined =
        productanalytics.make(
          'archaeologist/popup',
          process.env.NODE_ENV,
          analyticsConfig
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

  return (
    <AppContainer>
      <PopUpContext.Provider value={{ storage: makeDatacenterStorageApi() }}>
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
const LoginBtnBox = styled.div`
  margin: 24px auto 0 auto;
  display: flex;
  justify-content: center;
`

const LoginPage = () => {
  const onClick = () => {
    browser.tabs.create({
      url: truthsayer.url.make({ pathname: '/login' }).toString(),
    })
  }
  return (
    <LoginPageBox>
      <LoginImageBox>
        <LogoImg src="/logo-128x128.png" />
      </LoginImageBox>
      <LoginBtnBox>
        <Button onClick={onClick}>
          Login
          <MdiLaunch
            css={css`
              vertical-align: middle;
            `}
          />
        </Button>
      </LoginBtnBox>
    </LoginPageBox>
  )
}

export default PopUpApp
