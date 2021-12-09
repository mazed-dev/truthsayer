/** @jsxImportSource @emotion/react */

import * as React from 'react'
import styled from '@emotion/styled'

import { authCookie } from 'smuggler-api'
import { MdiBookmarkAdd, MdiLaunch } from 'elementary'
import { Button } from './Button'

import { MessageType } from './../message/types'
import { TNode } from 'smuggler-api'

const Container = styled.div`
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  display: block;
`

export const SavePageButton = () => {
  const [savedNode, setSavedNode] = React.useState<TNode | null>(null)

  React.useEffect(() => {
    chrome.runtime.sendMessage({ type: 'REQUEST_SAVED_NODE' })

    chrome.runtime.onMessage.addListener((message: MessageType) => {
      switch (message.type) {
        case 'SAVED_NODE':
          setSavedNode(message.node)
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
    if (savedNode) {
      const { nid } = savedNode
      chrome.tabs.create({ url: `${authCookie.url}/n/${nid}` })
    }
  }

  if (savedNode) {
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
