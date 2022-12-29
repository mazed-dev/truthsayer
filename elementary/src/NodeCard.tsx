/** @jsxImportSource @emotion/react */

import React, { useState } from 'react'
import { useAsyncEffect } from 'use-async-effect'
import styled from '@emotion/styled'

import type { Ack, NodeTextData, TNode } from 'smuggler-api'
import { smuggler } from 'smuggler-api'
import { NodeTextEditor } from './editor/NodeTextEditor'
import { SlateText, TDoc } from './editor/types'
import { Spinner } from './spinner/mod'
import { NodeMedia } from './media/NodeMedia'

const Box = styled.div`
  border-radius: inherit;
`

export function NodeCard({
  node,
  saveNode,
  className,
}: {
  node: TNode
  saveNode: (text: NodeTextData) => Promise<Ack> | undefined
  className?: string
}) {
  const saveText = (text: SlateText) => {
    const doc = new TDoc(text)
    saveNode(doc.toNodeTextData())
  }
  return (
    <Box className={className}>
      <NodeMedia node={node} />
      <NodeTextEditor node={node} saveText={saveText} />
    </Box>
  )
}

export function NodeCardFetching({
  nid,
  saveNode,
  className,
}: {
  nid: string
  saveNode: (text: NodeTextData) => Promise<Ack> | undefined
  className?: string
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
  return <NodeCard node={node} saveNode={saveNode} className={className} />
}
