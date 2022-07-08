import React from 'react'
import { Container, Row } from 'react-bootstrap'
import { useAsyncEffect } from 'use-async-effect'

import browser from 'webextension-polyfill'

import styled from '@emotion/styled'
import { css } from '@emotion/react'

import { MessageType } from './../message/types'
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
    browser.runtime.onMessage.addListener(async (message: MessageType) => {
      switch (message.type) {
        case 'AUTH_STATUS':
          setAuthenticated(message.status)
          break
        default:
          break
      }
    })
    await browser.runtime.sendMessage({ type: 'REQUEST_AUTH_STATUS' })
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

async function printHistory() {
  console.log('Printing history for Mazed')
  const history = await browser.history.search({ text: '' })
  await browser.runtime.sendMessage({
    type: 'READ_URL_CONTENTS_SILENTLY',
    url: 'https://arstechnica.com/gadgets/2022/06/apples-ar-vr-headset-will-arrive-in-january-2023-analyst-projects/',
  })

  // for (const item of await browser.history.search({ text: '' })) {
  //   console.log(item)
  // }
}

const SyncBrowserHistoryButton = () => {
  return <Button onClick={printHistory}>Sync browser history</Button>
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
