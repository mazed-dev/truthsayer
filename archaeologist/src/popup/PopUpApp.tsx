import React from 'react'
import { Container, Row } from 'react-bootstrap'
import { useAsyncEffect } from 'use-async-effect'

import browser from 'webextension-polyfill'

import styled from '@emotion/styled'
import { css } from '@emotion/react'

import { ToPopUp, FromPopUp } from './../message/types'
import { ViewActiveTabStatus } from './ViewActiveTabStatus'
import { Button } from './Button'
import { mazed } from '../util/mazed'
import { MdiLaunch } from 'elementary'

const AppContainer = styled.div`
  width: 280px;
  height: 280px;
`

export const PopUpApp = () => {
  const [authenticated, setAuthenticated] = React.useState(false)
  useAsyncEffect(async () => {
    browser.runtime.onMessage.addListener(async (message: ToPopUp.Message) => {
      switch (message.type) {
        case 'AUTH_STATUS':
          setAuthenticated(message.status)
          break
        default:
          break
      }
    })
    await FromPopUp.sendMessage({ type: 'REQUEST_AUTH_STATUS' })
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
      <Container>
        <Row>
          <ViewActiveTabStatus />
          <SyncBrowserHistoryButton />
        </Row>
      </Container>
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

const SyncBrowserHistoryButton = () => {
  const handler = async () => {
    const result = await FromPopUp.sendMessage({
      type: 'UPLOAD_BROWSER_HISTORY',
    })
    console.log(`result is ${JSON.stringify(result)}`)
  }
  return <Button onClick={handler}>Upload browser history</Button>
}

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
