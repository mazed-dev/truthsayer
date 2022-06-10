import React from 'react'
import { default as styled } from '@emotion/styled'

import { TNode } from 'smuggler-api'

import { kSmallCardWidth } from 'elementary'
import { NodeCard } from './NodeCard'

const Box = styled.div`
  margin: 12px auto 0 auto;
  width: ${kSmallCardWidth}px;
  background-color: white;
  display: block;
`
const sortNodesByCreationTimeEarliestFirst = (a: TNode, b: TNode) => {
  if (a.created_at === b.created_at) {
    return 0
  } else if (a.created_at < b.created_at) {
    return -1
  }
  return 1
}

const RefNodeCard = styled(NodeCard)`
  margin-top: 4px;
`

export const PageRelatedCards = ({
  bookmark,
  quotes,
}: {
  bookmark: TNode | undefined
  quotes: TNode[]
}) => {
  const refs = quotes
    .sort(sortNodesByCreationTimeEarliestFirst)
    .map((node: TNode) => {
      return <RefNodeCard node={node} key={node.nid} />
    })
  const bookmarkElement =
    bookmark == null ? null : <NodeCard node={bookmark} key={bookmark.nid} />
  return (
    <Box>
      {bookmarkElement}
      {refs}
    </Box>
  )
}
