/** @jsxImportSource @emotion/react */

import React from 'react'
import { useAsyncEffect } from 'use-async-effect'
import browser from 'webextension-polyfill'
import styled from '@emotion/styled'

import { TNode, TNodeJson } from 'smuggler-api'

import { MdiBookmarkAdd, Spinner } from 'elementary'
import { ButtonCreate } from './Button'

import { ToPopUp, FromPopUp } from './../message/types'
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

type Status = 'saved' | 'loading' | 'unmemorable' | 'memorable'

type State = {
  status: Status
  bookmark: TNode | null
  quotes: TNode[]
}

type Action =
  | {
      type: 'reset' | 'append'
      bookmark?: TNodeJson
      quotes?: TNodeJson[]
      unmemorable?: boolean
    }
  | { type: 'update-status'; status: Status }

function updateState(state: State, action: Action) {
  const newState = JSON.parse(JSON.stringify(state))
  switch (action.type) {
    case 'reset':
    case 'append':
      {
        if (action.bookmark != null) {
          const bookmark = TNode.fromJson(action.bookmark)
          newState.bookmark = bookmark
          newState.status = 'saved'
        } else {
          if (action.type === 'reset') {
            newState.bookmark = null
          }
        }
        if (action.unmemorable) {
          newState.status = 'unmemorable'
        } else {
          newState.status = 'memorable'
        }
        const added =
          action.quotes?.map((json: TNodeJson) => TNode.fromJson(json)) ?? []
        newState.quotes =
          action.type === 'reset' ? added : newState.quotes.concat(added)
      }
      break
    case 'update-status':
      {
        newState.status = action.status
      }
      break
  }
  return newState
}

export const ViewActiveTabStatus = () => {
  const initialState: State = {
    status: 'loading',
    bookmark: null,
    quotes: [],
  }
  const [state, dispatch] = React.useReducer(updateState, initialState)

  useAsyncEffect(async () => {
    const response = await FromPopUp.sendMessage({
      type: 'REQUEST_PAGE_IN_ACTIVE_TAB_STATUS',
    })
    const { bookmark, quotes, unmemorable } = response
    dispatch({ type: 'reset', quotes, bookmark, unmemorable })
  }, [])

  const handleSave = async () => {
    dispatch({ type: 'update-status', status: 'loading' })
    const { bookmark, unmemorable } = await FromPopUp.sendMessage({
      type: 'REQUEST_PAGE_TO_SAVE',
    })
    dispatch({ type: 'append', bookmark, unmemorable })
  }

  let btn
  if (state.status === 'memorable' && state.bookmark == null) {
    btn = (
      <ButtonCreate onClick={handleSave}>
        <MdiBookmarkAdd
          css={{
            verticalAlign: 'top',
          }}
        />
      </ButtonCreate>
    )
  } else if (state.status === 'loading') {
    btn = <Spinner.Wheel />
  }
  return (
    <Container>
      <Toolbar>{btn}</Toolbar>
      <PageRelatedCards
        bookmark={state.bookmark || undefined}
        quotes={state.quotes}
      />
    </Container>
  )
}
