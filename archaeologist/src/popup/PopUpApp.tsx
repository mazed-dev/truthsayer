import React from 'react'
import { useAsyncEffect } from 'use-async-effect'

import browser from 'webextension-polyfill'

import styled from '@emotion/styled'
import { css } from '@emotion/react'

import { FromPopUp, ToPopUp } from './../message/types'
import { ViewActiveTabStatus } from './ViewActiveTabStatus'
import { Button } from './Button'
import { mazed } from '../util/mazed'
import { MdiCancel, MdiCloudUpload, MdiDelete, MdiLaunch } from 'elementary'
import { BrowserHistoryUploadProgress } from '../background/browserHistoryUploadProgress'

const AppContainer = styled.div`
  width: 320px;
  height: 480px;
  font-family: 'Roboto', arial, sans-serif;
  font-style: normal;
  font-weight: 400;
`

const Navbar = styled.ul`
  list-style-type: none;
  margin: 0;
  padding: 0;
  overflow: hidden;
`
const NavbarItem = styled.li`
  float: right;
`
const NavbarButton = styled(Button)`
  display: block;
  padding: 0 4px 0 4px;
  color: #999999;
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
      <UploadBrowserHistoryButton progress={browserHistoryUploadProgress} />
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
  const buttonStyle = css`
    font-size: 14px;
  `
  const primaryAction =
    progress.processed === progress.total ? (
      <NavbarButton onClick={startUpload}>
        <MdiCloudUpload css={buttonStyle} />
      </NavbarButton>
    ) : (
      <NavbarButton onClick={cancelUpload} disabled={isBeingCancelled}>
        <MdiCancel css={buttonStyle} />
        {progress.processed}/{progress.total}
      </NavbarButton>
    )
  return (
    <Navbar>
      <NavbarItem key={'delete'}>
        <NavbarButton
          onClick={deletePreviouslyUploaded}
          disabled={progress.processed !== progress.total || isBeingCancelled}
        >
          <MdiDelete css={buttonStyle} />
          {deletedNodesCount > 0 ? deletedNodesCount : null}
        </NavbarButton>
      </NavbarItem>
      <NavbarItem key={'action'}>{primaryAction}</NavbarItem>
    </Navbar>
  )
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
