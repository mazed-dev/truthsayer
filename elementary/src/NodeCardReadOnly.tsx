import React, { useState } from 'react'
import { useAsyncEffect } from 'use-async-effect'
import styled from '@emotion/styled'

import { TNode, smuggler } from 'smuggler-api'
import { NodeTextReader } from './editor/NodeTextReader'
import { Spinner } from './spinner/mod'
import { NodeMedia } from './media/NodeMedia'

const Box = styled.div`
  border-radius: inherit;
`

export function NodeCardReadOnly({
  node,
  className,
  strippedRefs,
}: {
  node: TNode
  className?: string
  strippedRefs?: boolean
}) {
  return (
    <Box className={className}>
      <NodeMedia node={node} strippedRefs={strippedRefs} />
      <NodeTextReader node={node} />
    </Box>
  )
}

export function NodeCardReadOnlyFetching({
  nid,
  className,
  strippedRefs,
}: {
  nid: string
  className?: string
  strippedRefs?: boolean
}) {
  const [node, setNode] = useState<TNode | null>(null)
  const fetchNodeAbortController = new AbortController()
  useAsyncEffect(
    async (isMounted) => {
      const n = await smuggler.node.get({
        nid,
        signal: fetchNodeAbortController.signal,
      })
      if (isMounted()) {
        setNode(n)
      }
    },
    [nid]
  )
  if (node == null) {
    return <Spinner.Wheel />
  }
  return (
    <NodeCardReadOnly
      node={node}
      strippedRefs={strippedRefs}
      className={className}
    />
  )
}
