import React from 'react'

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
export const NodeCard = ({
  onClick,
  node,
  className,
}: {
  node: TNode
  onClick: () => void
  className?: string
}) => {
  return (
    <Box onClick={onClick} className={className}>
      <ShrinkCard>
        <NodeCardReadOnly node={node} />
      </ShrinkCard>
      <NodeTimeBadge
        created_at={node.created_at}
        updated_at={node.updated_at}
      />
    </Box>
  )
}
