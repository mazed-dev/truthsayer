/** @jsxImportSource @emotion/react */

import * as React from 'react'
import styled from '@emotion/styled'

import { authCookie } from 'smuggler-api'
import { MdiBookmarkAdd, MdiLaunch } from 'elementary'
import { Button } from './Button'

import { MessageTypes } from './../message/types'

const Container = styled.div`
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  display: block;
`

export const SavePageButton = () => {
  const [savedNid, setSavedNid] = React.useState<string | null>(null)

  React.useEffect(() => {
    chrome.runtime.sendMessage({ type: 'REQUEST_SAVED_STATUS' })

    chrome.runtime.onMessage.addListener((message: MessageTypes) => {
      switch (message.type) {
        case 'SAVED_STATUS':
          setSavedNid(message.nid)
          break
        default:
          break
      }
    })
  }, [])

  const handleSave = () => {
    chrome.runtime.sendMessage({ type: 'REQUEST_PAGE_TO_SAVE' })
  }

  const handleGoToNode = () => {
    chrome.tabs.create({ url: `${authCookie.url}/n/${savedNid}` })
  }

  if (savedNid) {
    return (
      <Container>
        <Button onClick={handleGoToNode}>
          <MdiLaunch />
        </Button>
      </Container>
    )
  } else {
    return (
      <Container>
        <Button onClick={handleSave}>
          <MdiBookmarkAdd />
        </Button>
      </Container>
    )
  }
}
