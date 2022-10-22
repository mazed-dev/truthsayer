import React from 'react'
import { useAsyncEffect } from 'use-async-effect'

import browser from 'webextension-polyfill'

import styled from '@emotion/styled'
import { css } from '@emotion/react'

import { FromPopUp } from './../message/types'
import { ViewActiveTabStatus } from './ViewActiveTabStatus'
import { Button } from './Button'
import { mazed } from '../util/mazed'
import { MdiLaunch } from 'elementary'

const AppContainer = styled.div`
  width: 320px;
  height: 480px;
  font-family: 'Roboto', arial, sans-serif;
  font-style: normal;
  font-weight: 400;
`

export const PopUpApp = () => {
  const [authenticated, setAuthenticated] = React.useState(false)

  useAsyncEffect(async () => {
    const response = await FromPopUp.sendMessage({
      type: 'REQUEST_AUTH_STATUS',
    })
    setAuthenticated(response.status)
  }, [])

  if (!authenticated) {
    return (
      <AppContainer>
        <LoginPage />
      </AppContainer>
    )
  }
  return (
    <AppContainer>
      <ViewActiveTabStatus />
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
      url: mazed.makeUrl({ pathname: '/login' }).toString(),
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
