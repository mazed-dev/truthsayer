/** @jsxImportSource @emotion/react */

import React from 'react'
import { useAsyncEffect } from 'use-async-effect'
import styled from '@emotion/styled'

import { NodeUtil } from 'smuggler-api'
import type { TNode, TNodeJson } from 'smuggler-api'

import { MdiBookmarkAdd, Spinner } from 'elementary'
import { ButtonCreate } from './Button'

import { FromPopUp } from './../message/types'
import {
  CardsConnectedToPage,
  CardsSuggestedForPage,
  CardsSuggestedForPageProps,
} from './PageRelatedCards'
import { errorise } from 'armoury'

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

const ErrorBox = styled.div`
  color: red;
`

type BookmarkState =
  | { type: 'saved'; value: TNode }
  | { type: 'saving' }
  | { type: 'not-saved'; memorable: boolean; error?: string }

type TabState =
  | { status: 'loading' }
  | {
      status: 'loaded'
      bookmark: BookmarkState
      fromNodes: TNode[]
      toNodes: TNode[]
    }
  | {
      status: 'error'
      error?: string
    }

type TabStateAction =
  | {
      type: 'init'
      bookmark: BookmarkState
      fromNodes: TNode[]
      toNodes: TNode[]
    }
  | {
      type: 'mark-as-errored'
      error: string
    }
  | { type: 'update-bookmark'; state: BookmarkState }

function updateTabState(state: TabState, action: TabStateAction): TabState {
  switch (action.type) {
    case 'init': {
      const { bookmark, fromNodes, toNodes } = action
      return {
        status: 'loaded',
        bookmark,
        fromNodes,
        toNodes,
      }
    }
    case 'mark-as-errored': {
      return { status: 'error', error: action.error }
    }
    case 'update-bookmark': {
      if (state.status !== 'loaded') {
        throw new Error(
          `Attempted to update bookmark, but tab state unexpectedly is '${state.status}'`
        )
      }
      return { ...state, bookmark: action.state }
    }
  }
}

function makeBookmarkPageButton(
  bookmarkState: BookmarkState,
  dispatch: React.Dispatch<TabStateAction>
) {
  const handleSave = async () => {
    dispatch({ type: 'update-bookmark', state: { type: 'saving' } })
    try {
      const { bookmark, unmemorable } = await FromPopUp.sendMessage({
        type: 'REQUEST_PAGE_TO_SAVE',
      })
      const newBookmarkState: BookmarkState =
        bookmark != null
          ? { type: 'saved', value: NodeUtil.fromJson(bookmark) }
          : { type: 'not-saved', memorable: !unmemorable }
      dispatch({
        type: 'update-bookmark',
        state: newBookmarkState,
      })
    } catch (e) {
      const newBookmarkState: BookmarkState =
        bookmarkState.type === 'not-saved'
          ? { ...bookmarkState, error: errorise(e).message }
          : bookmarkState
      dispatch({
        type: 'update-bookmark',
        state: newBookmarkState,
      })
    }
  }

  switch (bookmarkState.type) {
    case 'not-saved': {
      if (!bookmarkState.memorable) {
        return null
      }
      const btnIcon = <MdiBookmarkAdd css={{ verticalAlign: 'top' }} />
      return <ButtonCreate onClick={handleSave}>{btnIcon}</ButtonCreate>
    }
    case 'saving': {
      return <Spinner.Wheel />
    }
    case 'saved': {
      // Page already bookmarked, its card will be displayed by a different widget
      return null
    }
  }
}

export const ViewActiveTabStatus = () => {
  const initialTabState: TabState = { status: 'loading' }
  const [tabState, dispatch] = React.useReducer(updateTabState, initialTabState)

  useAsyncEffect(async () => {
    try {
      const { bookmark, unmemorable, fromNodes, toNodes } =
        await FromPopUp.sendMessage({
          type: 'REQUEST_PAGE_IN_ACTIVE_TAB_STATUS',
        })
      const bookmarkState: BookmarkState =
        bookmark != null
          ? { type: 'saved', value: NodeUtil.fromJson(bookmark) }
          : { type: 'not-saved', memorable: !unmemorable }
      dispatch({
        type: 'init',
        bookmark: bookmarkState,
        fromNodes: fromNodes.map((json: TNodeJson) => NodeUtil.fromJson(json)),
        toNodes: toNodes.map((json: TNodeJson) => NodeUtil.fromJson(json)),
      })
    } catch (e) {
      dispatch({ type: 'mark-as-errored', error: errorise(e).message })
    }
  }, [])

  const [suggestions, setSuggestions] =
    React.useState<CardsSuggestedForPageProps>({
      status: 'loading',
    })
  useAsyncEffect(async () => {
    try {
      const { suggestedAkinNodes } = await FromPopUp.sendMessage({
        type: 'REQUEST_SUGGESTIONS_TO_PAGE_IN_ACTIVE_TAB',
      })
      setSuggestions({
        status: 'loaded',
        suggestedAkinNodes: suggestedAkinNodes.map((json: TNodeJson) =>
          NodeUtil.fromJson(json)
        ),
      })
    } catch (e) {
      setSuggestions({ status: 'error', error: errorise(e).message })
    }
  }, [])

  if (tabState.status === 'loading') {
    // If no tab information is known yet, show a single spinner and nothing else
    return (
      <Toolbar>
        <Spinner.Wheel />
      </Toolbar>
    )
  } else if (tabState.status === 'error') {
    // If failed to load tab information, show a single error and nothing else
    return <ErrorBox>{tabState.error}</ErrorBox>
  }
  // If tab information is known, show action button, suggestions etc

  return (
    <Container>
      <Toolbar>{makeBookmarkPageButton(tabState.bookmark, dispatch)}</Toolbar>
      <ErrorBox>
        {tabState.bookmark.type === 'not-saved'
          ? tabState.bookmark.error
          : null}
      </ErrorBox>
      <CardsConnectedToPage
        bookmark={
          tabState.bookmark.type === 'saved'
            ? tabState.bookmark.value
            : undefined
        }
        fromNodes={tabState.fromNodes}
        toNodes={tabState.toNodes}
      />
      <CardsSuggestedForPage {...suggestions} />
    </Container>
  )
}
