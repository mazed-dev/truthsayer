import React from 'react'
import browser from 'webextension-polyfill'
import styled from '@emotion/styled'

import {TNode} from 'smuggler-api'

import {mazed} from '../util/mazed'
import {kSmallCardWidth} from 'elementary'
import {NodeCard} from './NodeCard'

const Box = styled.div`
  margin: 12px auto 0 auto;
  width: ${kSmallCardWidth}px;
  background-color: white;
  display: block;
`

export const PageRelatedCards = ({bookmark, quotes}: {
  bookmark: TNode | undefined
  quotes: TNode[]
}) => {
  const refs = quotes.map((node: TNode) => {
    return <NodeCard onClick={() => {}} node={node} key={node.nid} />
  })
  const bookmarkElement = bookmark == null ? null : (
    <NodeCard onClick={() => {
      browser.tabs.create({
        url: mazed.makeNodeUrl(bookmark.nid).toString(),
      })
    }} node={bookmark} key={bookmark.nid} />)
  return (
    <Box>
      {bookmarkElement}
      {refs}
    </Box>
  )
}
