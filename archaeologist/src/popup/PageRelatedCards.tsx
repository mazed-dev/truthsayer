import React from 'react'
import styled from '@emotion/styled'

import { TNode } from 'smuggler-api'
import { NodeCard } from './NodeCard'

const Box = styled.div`
  display: block;
  width: 100%;
  margin: 0;
  background-color: white;
`
const PopUpBookmarkCard = styled(NodeCard)`
  width: 312px;
`

const PopUpNodeCard = styled(NodeCard)`
  width: 260px;
`

const CardRow = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
`
const BookmarkRow = styled(CardRow)`
  margin: 4px 0 12px 0;
  justify-content: center;
`

const RefCardRow = styled(CardRow)`
  margin: 4px;
`

const RightCardRow = styled(RefCardRow)`
  justify-content: flex-end;
`

const LeftCardRow = styled(RefCardRow)`
  justify-content: flex-start;
`

const sortNodesByCreationTimeLatestFirst = (a: TNode, b: TNode) => {
  if (a.created_at === b.created_at) {
    return 0
  } else if (a.created_at < b.created_at) {
    return 1
  }
  return -1
}

export const PageRelatedCards = ({
  bookmark,
  fromNodes,
  toNodes,
}: {
  bookmark: TNode | undefined
  fromNodes: TNode[]
  toNodes: TNode[]
}) => {
  const bookmarkCard =
    bookmark == null ? null : (
      <BookmarkRow key={bookmark?.nid}>
        <PopUpBookmarkCard node={bookmark} key={bookmark.nid} />
      </BookmarkRow>
    )
  const toNodesCards = toNodes
    .sort(sortNodesByCreationTimeLatestFirst)
    .map((node: TNode) => (
      <RightCardRow key={node.nid}>
        <PopUpNodeCard node={node} />
      </RightCardRow>
    ))
  const fromNodesCards = fromNodes
    .sort(sortNodesByCreationTimeLatestFirst)
    .map((node: TNode) => (
      <LeftCardRow key={node.nid}>
        <PopUpNodeCard node={node} />
      </LeftCardRow>
    ))
  return (
    <Box>
      {bookmarkCard}
      {toNodesCards}
      {fromNodesCards}
    </Box>
  )
}
