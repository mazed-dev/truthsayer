/**
 * This is a narrow representation of a card with neighbours:
 * ┌───────────┐                    ┌─────────┐
 * │ From node │─┐  ┌──────────┐ ┌─▶│ To node │
 * └───────────┘ ├─▶│ Bookmark │─┤  └─────────┘
 * ┌───────────┐ │  └──────────┘ │  ┌─────────┐
 * │ From node │─┘               └─▶│ To node │
 * └───────────┘                    └─────────┘
 *
 * It's shown as following:
 *  ┌──────────┐
 *  │ Bookmark │
 *  └──────────┘
 *     ▶┌─────────┐
 *      │ To node │
 *      └─────────┘
 *     ▶┌─────────┐
 *      │ To node │
 *      └─────────┘
 * ┌───────────┐
 * │ From node │
 * └───────────┘▶
 * ┌───────────┐
 * │ From node │
 * └───────────┘▶
 * Likely related (1)
 *     ▶┌──────────────┐
 *      │ Related node │
 *      └──────────────┘
 */
import React from 'react'
import styled from '@emotion/styled'

import type { TNode } from 'smuggler-api'
import { NodeCard } from './NodeCard'
import { Spinner } from 'elementary'

const Box = styled.div`
  display: block;
  width: 100%;
  margin: 0;
  background-color: white;
`
const PopUpBookmarkCard = styled(NodeCard)`
  width: 300px;
`

const PopUpToNodeCard = styled(NodeCard)`
  width: 300px;
  position: relative;
  &:before {
    content: ' ';
    position: absolute;
    width: 0;
    height: 0;
    left: -10px;
    right: auto;
    top: 7px;
    bottom: auto;
    border: 7px solid;
    border-color: transparent transparent transparent #e3e3e3;
  }
`

const PopUpFromNodeCard = styled(NodeCard)`
  width: 300px;
  position: relative;
  &:before {
    content: ' ';
    position: absolute;
    width: 0;
    height: 0;
    right: -17px;
    left: auto;
    bottom: 7px;
    top: auto;
    border: 7px solid;
    border-color: transparent transparent transparent #e3e3e3;
  }
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
  margin: 5px 2px 5px 2px;
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

const BookmarkCard = ({ bookmark }: { bookmark?: TNode }) => {
  return bookmark == null ? null : (
    <BookmarkRow key={bookmark?.nid}>
      <PopUpBookmarkCard node={bookmark} key={bookmark.nid} />
    </BookmarkRow>
  )
}

const ToNodesCards = ({ toNodes }: { toNodes: TNode[] }) => {
  return (
    <>
      {toNodes.sort(sortNodesByCreationTimeLatestFirst).map((node: TNode) => (
        <RightCardRow key={node.nid}>
          <PopUpToNodeCard node={node} />
        </RightCardRow>
      ))}
    </>
  )
}

const FromNodesCards = ({ fromNodes }: { fromNodes: TNode[] }) => {
  return (
    <>
      {fromNodes.sort(sortNodesByCreationTimeLatestFirst).map((node: TNode) => (
        <LeftCardRow key={node.nid}>
          <PopUpFromNodeCard node={node} />
        </LeftCardRow>
      ))}
    </>
  )
}

const SuggestedHeader = styled.div`
  position: relative;
  margin-top: 16px;
  margin-bottom: 10px;
  width: 100%;
`
const SuggestedTitle = styled.span`
  font-style: italic;
  color: #9f9f9f;
`
const SuggestedAkinNodes = ({
  suggestedAkinNodes,
}: {
  suggestedAkinNodes?: TNode[]
}) => {
  if (suggestedAkinNodes == null) {
    return <Spinner.Wheel />
  }
  return (
    <>
      <SuggestedHeader>
        <SuggestedTitle>
          🪄 Likely related ({suggestedAkinNodes.length})
        </SuggestedTitle>
      </SuggestedHeader>
      {suggestedAkinNodes.map((node: TNode) => (
        <RightCardRow key={node.nid}>
          <PopUpToNodeCard node={node} />
        </RightCardRow>
      ))}
    </>
  )
}

export const PageRelatedCards = ({
  bookmark,
  fromNodes,
  toNodes,
  suggestedAkinNodes,
}: {
  bookmark: TNode | undefined
  fromNodes: TNode[]
  toNodes: TNode[]
  suggestedAkinNodes?: TNode[]
}) => {
  return (
    <Box>
      <BookmarkCard bookmark={bookmark} />
      <ToNodesCards toNodes={toNodes} />
      <FromNodesCards fromNodes={fromNodes} />
      <SuggestedAkinNodes suggestedAkinNodes={suggestedAkinNodes} />
    </Box>
  )
}
