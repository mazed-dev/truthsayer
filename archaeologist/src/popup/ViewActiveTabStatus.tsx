/** @jsxImportSource @emotion/react */

import React from 'react'
import { useAsyncEffect } from 'use-async-effect'
import styled from '@emotion/styled'

import { NodeUtil } from 'smuggler-api'
import type { TNode, TNodeJson } from 'smuggler-api'

import { MdiBookmarkAdd, Spinner } from 'elementary'
import { ButtonCreate } from './Button'
import { log } from 'armoury'

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
  log.debug('Got to update state', state, action)
  const newState = state
  switch (action.type) {
    case 'reset':
    case 'append':
      {
        if (action.bookmark != null) {
          const bookmark = NodeUtil.fromJson(action.bookmark)
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
        const fromNodes = action.fromNodes.map((json: TNodeJson) =>
          NodeUtil.fromJson(json)
        )
        newState.fromNodes =
          action.type === 'reset'
            ? fromNodes
            : newState.fromNodes.concat(fromNodes)
        const toNodes = action.toNodes.map((json: TNodeJson) =>
          NodeUtil.fromJson(json)
        )
        newState.toNodes =
          action.type === 'reset' ? toNodes : newState.toNodes.concat(toNodes)
      }
      break
    case 'reset-suggested-akin-nodes':
      {
        newState.suggestedAkinNodes = action.suggestedAkinNodes.map(
          (json: TNodeJson) => NodeUtil.fromJson(json)
        )
      }
      break
    case 'update-status':
      newState.status = action.status
      break
  }
  log.debug('New state', newState)
  return { ...newState }
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
  log.debug('Render state', state, state.status, state.bookmark)
  let btn
  if (state.status === 'memorable' && state.bookmark == null) {
    log.debug('Render memorable and no bookmark')
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
