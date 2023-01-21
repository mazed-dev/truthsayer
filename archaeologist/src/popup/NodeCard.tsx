import React, { useContext } from 'react'
import browser from 'webextension-polyfill'

import styled from '@emotion/styled'
import {
  SmallCard,
  ShrinkCard,
  NodeTimeBadge,
  NodeCardReadOnly,
  truthsayer,
} from 'elementary'

import type { TNode } from 'smuggler-api'
import { PopUpContext } from './context'

const Box = styled(SmallCard)`
  width: 100%;
  cursor: pointer;
`
const FixedShrinkCard = styled(ShrinkCard)`
  height: min-content;
  max-height: 142px;
`
export const NodeCard = ({
  node,
  className,
}: {
  node: TNode
  className?: string
}) => {
  const ctx = useContext(PopUpContext)
  const { nid } = node
  return (
    <Box className={className}>
      <FixedShrinkCard
        onClick={() =>
          browser.tabs.create({
            url: truthsayer.url.makeNode(nid).toString(),
          })
        }
      >
        <NodeCardReadOnly
          node={node}
          strippedRefs
          strippedActions
          storage={ctx.storage}
        />
      </FixedShrinkCard>
      <NodeTimeBadge
        created_at={node.created_at}
        updated_at={node.updated_at}
      />
    </Box>
  )
}
