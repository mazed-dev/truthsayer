/** @jsxImportSource @emotion/react */

import React from 'react'
import { useAsyncEffect } from 'use-async-effect'
import browser from 'webextension-polyfill'
import { default as styled } from '@emotion/styled'

import { TNode, TNodeJson } from 'smuggler-api'

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
  const [pageSavedNode, setPageSavedNode] = React.useState<TNode | null>(null)
  const [pageSavedQuotes, setPageSavedQuotes] = React.useState<TNode[]>([])

  useAsyncEffect(async () => {
    browser.runtime.onMessage.addListener((message: MessageType) => {
      switch (message.type) {
        case 'UPDATE_POPUP_CARDS':
          {
            const { bookmark, quotes, unmemorable, mode } = message
            if (bookmark != null) {
              const node = TNode.fromJson(bookmark)
              setPageSavedNode(node)
              setPageStatus('saved')
            } else {
              if (mode === 'reset') {
                setPageSavedNode(null)
              }
            }
            if (unmemorable) {
              setPageStatus('unmemorable')
            } else {
              setPageStatus('memorable')
            }
            const added = quotes.map((json: TNodeJson) => TNode.fromJson(json))
            setPageSavedQuotes((existing: TNode[]) => {
              if (mode === 'reset') {
                return added
              }
              return existing.concat(added)
            })
          }
          break
        default:
          break
      }
    })
    await browser.runtime.sendMessage({
      type: 'REQUEST_PAGE_IN_ACTIVE_TAB_STATUS',
    })
  }, [])

  const handleSave = () => {
    setPageStatus('loading')
    browser.runtime.sendMessage({ type: 'REQUEST_PAGE_TO_SAVE' })
  }

  let btn
  if (pageStatus === 'memorable' && pageSavedNode == null) {
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
  }
  return (
    <Container>
      <Toolbar>{btn}</Toolbar>
      <PageRelatedCards
        bookmark={pageSavedNode || undefined}
        quotes={pageSavedQuotes}
      />
    </Container>
  )
}
