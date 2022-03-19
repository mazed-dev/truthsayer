/** @jsxImportSource @emotion/react */

import React from 'react'
import { useAsyncEffect } from 'use-async-effect'
import browser from 'webextension-polyfill'
import styled from '@emotion/styled'

import { TNode } from 'smuggler-api'

import { MdiBookmarkAdd, Spinner } from 'elementary'
import { ButtonCreate } from './Button'

import { MessageType } from './../message/types'
import { PageRelatedCards } from './PageRelatedCards'

const Container = styled.div`
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  display: block;
`

const Toolbar = styled.div`
  margin: 12px auto 0 auto;
  display: flex;
  justify-content: center;
`

export const ViewActiveTabStatus = () => {
  const [pageStatus, setPageStatus] = React.useState<
    'saved' | 'loading' | 'unmemorable' | 'memorable'
  >('loading')
  const [pageSavedNode, setPageSavedNode] = React.useState<any | null>(null)

  useAsyncEffect(async () => {
    browser.runtime.onMessage.addListener((message: MessageType) => {
      switch (message.type) {
        case 'SAVED_NODE':
          const { node, unmemorable } = message
          if (node != null) {
            // setPageSavedNode(TNode.fromJson(node))
            setPageSavedNode(node)
            setPageStatus('saved')
          } else if (unmemorable) {
            setPageStatus('unmemorable')
          } else {
            setPageStatus('memorable')
          }
          break
        default:
          break
      }
    })
    await browser.runtime.sendMessage({ type: 'REQUEST_SAVED_NODE' })
  }, [])

  const handleSave = () => {
    setPageStatus('loading')
    browser.runtime.sendMessage({ type: 'REQUEST_PAGE_TO_SAVE' })
  }

  let btn
  let grid
  if (pageStatus === 'memorable') {
    btn = (
      <ButtonCreate onClick={handleSave}>
        <MdiBookmarkAdd
          css={{
            verticalAlign: 'top',
          }}
        />
      </ButtonCreate>
    )
  } else if (pageStatus === 'loading') {
    btn = <Spinner.Wheel />
  } else if (pageStatus === 'unmemorable') {
    btn = (
      <div>
        <p>This page can not be bookmarked, sorry for the inconvenience.</p>
      </div>
    )
  } else if (pageStatus === 'saved') {
    if (pageSavedNode != null) {
      const node = TNode.fromJson(pageSavedNode)
      grid = <PageRelatedCards node={node} />
    } else {
      btn = (
        <div>
          <p>Internal error</p>
        </div>
      )
    }
  }
  return (
    <Container>
      <Toolbar>{btn}</Toolbar>
      {grid}
    </Container>
  )
}
