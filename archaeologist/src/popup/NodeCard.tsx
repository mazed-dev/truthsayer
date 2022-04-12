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

import { TNode } from 'smuggler-api'

const Box = styled(SmallCard)`
  width: 100%;
`
const FixedShrinkCard = styled(ShrinkCard)`
  height: min-content;
  max-height: 142px;
  cursor: pointer;
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
        <NodeCardReadOnly node={node} strippedRefs />
      </FixedShrinkCard>
      <NodeTimeBadge
        created_at={node.created_at}
        updated_at={node.updated_at}
      />
    </Box>
  )
}