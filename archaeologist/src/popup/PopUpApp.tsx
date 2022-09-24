import React from 'react'
import { Container, Row } from 'react-bootstrap'
import { useAsyncEffect } from 'use-async-effect'

import browser from 'webextension-polyfill'

import styled from '@emotion/styled'
import { css } from '@emotion/react'

import { FromPopUp, ToPopUp } from './../message/types'
import { ViewActiveTabStatus } from './ViewActiveTabStatus'
import { Button } from './Button'
import { mazed } from '../util/mazed'
import { MdiDelete, MdiLaunch } from 'elementary'
import { BrowserHistoryUploadProgress } from '../background/browserHistoryUploadProgress'

const AppContainer = styled.div`
  width: 280px;
  height: 280px;
  font-family: 'Roboto', arial, sans-serif;
  font-style: normal;
  font-weight: 400;
`

export const PopUpApp = () => {
  const [authenticated, setAuthenticated] = React.useState(false)
  const [browserHistoryUploadProgress, setBrowserHistoryUploadProgress] =
    React.useState<BrowserHistoryUploadProgress>({
      processed: 0,
      total: 0,
    })
  useAsyncEffect(async () => {
    const response = await FromPopUp.sendMessage({
      type: 'REQUEST_AUTH_STATUS',
    })
    setAuthenticated(response.status)

    browser.runtime.onMessage.addListener(async (request: ToPopUp.Request) => {
      switch (request.type) {
        case 'REPORT_BROWSER_HISTORY_UPLOAD_PROGRESS':
          setBrowserHistoryUploadProgress(request.newState)
          break
        default:
          throw new Error(
            `popup received msg from background of unknown type, message: ${JSON.stringify(
              request
            )}`
          )
      }
    })
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
          <UploadBrowserHistoryButton progress={browserHistoryUploadProgress} />
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

type UploadBrowserHistoryProps = React.PropsWithChildren<{
  progress: BrowserHistoryUploadProgress
}>

const UploadBrowserHistoryButton = ({
  progress,
}: UploadBrowserHistoryProps) => {
  const [isBeingCancelled, setIsBeingCancelled] = React.useState(false)
  const [deletedNodesCount, setDeletedNodesCount] = React.useState(0)

  const startUpload = async () => {
    FromPopUp.sendMessage({
      type: 'UPLOAD_BROWSER_HISTORY',
    }).finally(() => {
      setIsBeingCancelled(false)
    })
  }
  const cancelUpload = () => {
    setIsBeingCancelled(true)
    FromPopUp.sendMessage({
      type: 'CANCEL_BROWSER_HISTORY_UPLOAD',
    })
  }
  const deletePreviouslyUploaded = () => {
    FromPopUp.sendMessage({
      type: 'DELETE_PREVIOUSLY_UPLOADED_BROWSER_HISTORY',
    }).then((response) => setDeletedNodesCount(response.numDeleted))
  }

  if (progress.processed === progress.total) {
    return (
      <Row>
        <Button onClick={startUpload}>Upload browser history</Button>
        <Button onClick={deletePreviouslyUploaded}>
          <MdiDelete />
          {deletedNodesCount > 0 ? deletedNodesCount : null}
        </Button>
      </Row>
    )
  } else {
    return (
      <Button onClick={cancelUpload} disabled={isBeingCancelled}>
        {isBeingCancelled ? 'Cancelling' : 'Cancel'} browser history upload (
        {progress.processed}/{progress.total})
      </Button>
    )
  }
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
