/** @jsxImportSource @emotion/react */

import React from 'react'
import { useAsyncEffect } from 'use-async-effect'
import styled from '@emotion/styled'

import { NodeUtil } from 'smuggler-api'
import type { TNode, TNodeJson } from 'smuggler-api'

import { MdiBookmarkAdd, Spinner } from 'elementary'
import { ButtonCreate } from './Button'

import { FromPopUp } from './../message/types'
import { PageRelatedCards } from './PageRelatedCards'

const Container = styled.div`
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  display: block;
`

const Toolbar = styled.div`
  margin: 0 auto 0 auto;
  display: flex;
  justify-content: center;
`

type Status = 'saved' | 'loading' | 'unmemorable' | 'memorable'

type State = {
  status: Status
  bookmark: TNode | null
  fromNodes: TNode[]
  toNodes: TNode[]
  suggestedAkinNodes?: TNode[]
}

type Action =
  | {
      type: 'reset' | 'append'
      bookmark?: TNodeJson
      unmemorable?: boolean
      fromNodes: TNodeJson[]
      toNodes: TNodeJson[]
    }
  | {
      type: 'reset-suggested-akin-nodes'
      suggestedAkinNodes: TNodeJson[]
    }
  | { type: 'update-status'; status: Status }

function updateState(state: State, action: Action): State {
  switch (action.type) {
    case 'reset':
    case 'append': {
      let { bookmark, status, fromNodes, toNodes } = state
      if (action.bookmark != null) {
        bookmark = NodeUtil.fromJson(action.bookmark)
        status = 'saved'
      } else {
        if (action.type === 'reset') {
          bookmark = null
        }
      }
      if (action.unmemorable) {
        status = 'unmemorable'
      } else {
        status = 'memorable'
      }
      fromNodes = action.fromNodes
        .map((json: TNodeJson) => NodeUtil.fromJson(json))
        .concat(action.type === 'reset' ? [] : fromNodes)
      toNodes = action.toNodes
        .map((json: TNodeJson) => NodeUtil.fromJson(json))
        .concat(action.type === 'reset' ? [] : toNodes)
      return { ...state, bookmark, status, fromNodes, toNodes }
    }
    case 'reset-suggested-akin-nodes': {
      const suggestedAkinNodes = action.suggestedAkinNodes.map(
        (json: TNodeJson) => NodeUtil.fromJson(json)
      )
      return { ...state, suggestedAkinNodes }
    }
    case 'update-status': {
      const status = action.status
      return { ...state, status }
    }
  }
}

export const ViewActiveTabStatus = () => {
  const initialState: State = {
    status: 'loading',
    bookmark: null,
    fromNodes: [],
    toNodes: [],
  }
  const [state, dispatch] = React.useReducer(updateState, initialState)

  useAsyncEffect(async () => {
    const { bookmark, unmemorable, fromNodes, toNodes } =
      await FromPopUp.sendMessage({
        type: 'REQUEST_PAGE_IN_ACTIVE_TAB_STATUS',
      })
    dispatch({
      type: 'reset',
      bookmark,
      unmemorable,
      fromNodes,
      toNodes,
    })
  }, [])

  useAsyncEffect(async () => {
    const { suggestedAkinNodes } = await FromPopUp.sendMessage({
      type: 'REQUEST_SUGGESTIONS_TO_PAGE_IN_ACTIVE_TAB',
    })
    dispatch({ type: 'reset-suggested-akin-nodes', suggestedAkinNodes })
  }, [])

  const handleSave = async () => {
    dispatch({ type: 'update-status', status: 'loading' })
    const { bookmark, unmemorable } = await FromPopUp.sendMessage({
      type: 'REQUEST_PAGE_TO_SAVE',
    })
    dispatch({
      type: 'append',
      bookmark,
      unmemorable,
      fromNodes: [],
      toNodes: [],
    })
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
        fromNodes={state.fromNodes}
        toNodes={state.toNodes}
        suggestedAkinNodes={state.suggestedAkinNodes}
      />
    </Container>
  )
}
