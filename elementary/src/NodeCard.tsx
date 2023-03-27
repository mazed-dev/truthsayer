/** @jsxImportSource @emotion/react */

import React, { useState } from 'react'
import { useAsyncEffect } from 'use-async-effect'
import styled from '@emotion/styled'

import type { Ack, NodeTextData, StorageApi, TNode } from 'smuggler-api'
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
  storage,
  strippedFormatToolbar,
  onMediaLaunch,
  captureMetricOnCopy,
}: {
  node: TNode
  saveNode: (text: NodeTextData) => Promise<Ack> | undefined
  className?: string
  storage: StorageApi
  strippedFormatToolbar?: boolean
  // This is a hack to assign special action on media click instead of opening
  // original page e.g. on a preview image click
  onMediaLaunch?: () => void
  captureMetricOnCopy?: (subj: string) => void
}) {
  const saveText = (text: SlateText) => {
    const doc = new TDoc(text)
    saveNode(doc.toNodeTextData())
  }
  return (
    <Box className={className}>
      <NodeMedia
        node={node}
        storage={storage}
        onLaunch={onMediaLaunch}
        captureMetricOnCopy={captureMetricOnCopy}
      />
      <NodeTextEditor
        node={node}
        saveText={saveText}
        storage={storage}
        strippedFormatToolbar={strippedFormatToolbar}
        captureMetricOnCopy={captureMetricOnCopy}
      />
    </Box>
  )
}

export function NodeCardFetching({
  nid,
  saveNode,
  className,
  storage,
}: {
  nid: string
  saveNode: (text: NodeTextData) => Promise<Ack> | undefined
  className?: string
  storage: StorageApi
}) {
  const [node, setNode] = useState<TNode | null>(null)
  const fetchNodeAbortController = new AbortController()
  useAsyncEffect(
    async (isMounted) => {
      const n = await storage.node.get(
        {
          nid,
        },
        fetchNodeAbortController.signal
      )
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
    <NodeCard
      node={node}
      saveNode={saveNode}
      className={className}
      storage={storage}
    />
  )
}
