import React from 'react'
import browser from 'webextension-polyfill'
import { mazed } from '../util/mazed'

import styled from '@emotion/styled'
import {
  SmallCard,
  ShrinkCard,
  NodeTimeBadge,
  NodeCardReadOnly,
} from 'elementary'

import type { TNode } from 'smuggler-api'

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
  const { nid } = node
  return (
    <Box className={className}>
      <FixedShrinkCard
        onClick={() =>
          browser.tabs.create({
            url: mazed.makeNodeUrl(nid).toString(),
          })
        }
      >
        <NodeCardReadOnly node={node} strippedRefs strippedActions />
      </FixedShrinkCard>
      <NodeTimeBadge
        created_at={node.created_at}
        updated_at={node.updated_at}
      />
    </Box>
  )
}
