/** @jsxImportSource @emotion/react */

import * as React from 'react'
import styled from '@emotion/styled'

import { MdiBookmarkAdd, MdiLaunch, Spinner } from 'elementary'
import { Button } from './Button'

import { MessageType } from './../message/types'
import { mazed } from '../util/mazed'

const Container = styled.div`
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  display: block;
`

type Node = {
  nid: string
}

export const SavePageButton = () => {
  const [pageSavedNode, setPageSavedNode] = React.useState<
    Node | 'loading' | 'unmemorable' | 'memorable'
  >('loading')

  React.useEffect(() => {
    chrome.runtime.sendMessage({ type: 'REQUEST_SAVED_NODE' })

    chrome.runtime.onMessage.addListener((message: MessageType) => {
      switch (message.type) {
        case 'SAVED_NODE':
          const { nid, unmemorable } = message
          if (nid != null) {
            setPageSavedNode({ nid })
          } else if (unmemorable) {
            setPageSavedNode('unmemorable')
          } else {
            setPageSavedNode('memorable')
          }
          break
        default:
          break
      }
    })
  }, [])

  const handleSave = () => {
    setPageSavedNode('loading')
    chrome.runtime.sendMessage({ type: 'REQUEST_PAGE_TO_SAVE' })
  }

  const handleGoToNode = () => {
    const { nid } = pageSavedNode as Node
    chrome.tabs.create({
      url: mazed.makeNodeUrl(nid).toString(),
    })
  }

  let btn
  if (pageSavedNode === 'memorable') {
    btn = (
      <Button onClick={handleSave}>
        <MdiBookmarkAdd />
      </Button>
    )
  } else if (pageSavedNode === 'loading') {
    btn = <Spinner.Wheel />
  } else if (pageSavedNode === 'unmemorable') {
    btn = (
      <div>
        <p>This page can not be bookmarked, sorry for the inconvenience.</p>
      </div>
    )
  } else {
    btn = (
      <Button onClick={handleGoToNode}>
        <MdiLaunch />
      </Button>
    )
  }
  return <Container>{btn}</Container>
}
