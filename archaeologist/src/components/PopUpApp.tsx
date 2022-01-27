/** @jsxImportSource @emotion/react */

import React from 'react'
import { useAsyncEffect } from 'use-async-effect'

import browser from 'webextension-polyfill'

import styled from '@emotion/styled'

import { MessageType } from './../message/types'
import { ViewActiveTabStatus } from './ViewActiveTabStatus'
import { Relative, HVCentered } from './../util/layout'
import { Button } from './Button'
import { mazed } from '../util/mazed'

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
  return (
    <AppContainer>
      {authenticated ? <ViewActiveTabStatus /> : <LoginPage />}
    </AppContainer>
  )
}

const LogoImg = styled.img`
  margin-left: auto;
  margin-right: auto;
  margin: 12px;
`

const LoginPage = () => {
  const onClick = () => {
    browser.tabs.create({
      url: mazed.makeUrl({ pathname: '/login' }).toString(),
    })
  }
  return (
    <Relative>
      <HVCentered>
        <LogoImg src="/logo-128x128.png" />
        <Button onClick={onClick}>Login</Button>
      </HVCentered>
    </Relative>
  )
}

export default PopUpApp
