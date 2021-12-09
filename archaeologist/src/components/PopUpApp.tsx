/** @jsxImportSource @emotion/react */

import React from 'react'

import styled from '@emotion/styled'

import { MessageType } from './../message/types'
import { ViewActiveTabStatus } from './ViewActiveTabStatus'
import { Relative, HVCentered } from './../util/layout'
import { Button } from './Button'

import { authCookie } from 'smuggler-api'

const AppContainer = styled.div`
  width: 280px;
  height: 280px;
`

export const PopUpApp = () => {
  const [authenticated, setAuthenticated] = React.useState(false)
  React.useEffect(() => {
    chrome.runtime.sendMessage({ type: 'REQUEST_AUTH_STATUS' })
    chrome.runtime.onMessage.addListener((message: MessageType) => {
      switch (message.type) {
        case 'AUTH_STATUS':
          setAuthenticated(message.status)
          break
        default:
          break
      }
    })
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
    chrome.tabs.create({ url: `${authCookie.url}/login` })
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
