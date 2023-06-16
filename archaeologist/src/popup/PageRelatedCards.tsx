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
 */
import React from 'react'
import styled from '@emotion/styled'
import { css } from '@emotion/react'

import type { NodeTextData, TNode } from 'smuggler-api'
import { NodeType } from 'smuggler-api'
import { NodeReadOnly, NodeEditor } from './NodeCard'
import { FromPopUp } from './../message/types'
import type { UserFacingError } from './userFacingError'

const Box = styled.div`
  display: block;
  width: 100%;
  margin: 0;
  background-color: white;
`

const PopUpBookmarkCard = styled(NodeEditor)`
  width: 300px;
`

const RightHandCardArrow = css`
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
`

const PopUpToNodeCard = styled(NodeReadOnly)`
  width: 300px;
  position: relative;
  &:before {
    ${RightHandCardArrow}
  }
`
const PopUpToQuoteCard = styled(NodeEditor)`
  width: 300px;
  position: relative;
  &:before {
    ${RightHandCardArrow}
  }
`

const LeftHandCardArrow = css`
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
`

const PopUpFromNodeCard = styled(NodeReadOnly)`
  width: 300px;
  position: relative;
  &:before {
    ${LeftHandCardArrow}
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

const BookmarkCard = ({ bookmark }: { bookmark: TNode }) => {
  return (
    <BookmarkRow key={bookmark.nid}>
      <PopUpBookmarkCard
        node={bookmark}
        key={bookmark.nid}
        saveNode={async (text: NodeTextData) => {
          await FromPopUp.sendMessage({
            type: 'REQUEST_UPDATE_NODE',
            args: { nid: bookmark.nid, text },
          })
        }}
      />
    </BookmarkRow>
  )
}

const ToNodesCards = ({ toNodes }: { toNodes: TNode[] }) => {
  return (
    <>
      {toNodes.sort(sortNodesByCreationTimeLatestFirst).map((node: TNode) => {
        if (node.ntype === NodeType.WebQuote) {
          return (
            <RightCardRow key={node.nid}>
              <PopUpToQuoteCard
                node={node}
                saveNode={async (text: NodeTextData) => {
                  await FromPopUp.sendMessage({
                    type: 'REQUEST_UPDATE_NODE',
                    args: { nid: node.nid, text },
                  })
                }}
              />
            </RightCardRow>
          )
        } else {
          return (
            <RightCardRow key={node.nid}>
              <PopUpToNodeCard node={node} />
            </RightCardRow>
          )
        }
      })}
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

export const CardsConnectedToPage = ({
  bookmark,
  fromNodes,
  toNodes,
}: {
  bookmark?: TNode
  fromNodes: TNode[]
  toNodes: TNode[]
}) => {
  return (
    <Box>
      {bookmark != null ? <BookmarkCard bookmark={bookmark} /> : null}
      <ToNodesCards toNodes={toNodes} />
      <FromNodesCards fromNodes={fromNodes} />
    </Box>
  )
}

export type CardsSuggestedForPageProps =
  | { status: 'loading' }
  | {
      status: 'loaded'
      suggestedAkinNodes: TNode[]
    }
  | {
      status: 'error'
      error: UserFacingError
    }
