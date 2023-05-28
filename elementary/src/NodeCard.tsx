/** @jsxImportSource @emotion/react */

import React, { useState } from 'react'
import { useAsyncEffect } from 'use-async-effect'

import type { Ack, NodeTextData, TNode } from 'smuggler-api'
import { NodeTextEditor } from './editor/NodeTextEditor'
import { SlateText, TDoc } from './editor/types'
import { Spinner } from './spinner/mod'
import { NodeMedia } from './media/NodeMedia'
import { NodeCardBox } from './NodeCardReadOnly'
import { ElementaryContext } from './context'

export function NodeCard({
  ctx,
  node,
  saveNode,
  className,
  strippedFormatToolbar,
  onMediaLaunch,
}: {
  ctx: ElementaryContext
  node: TNode
  saveNode: (text: NodeTextData) => Promise<Ack> | undefined
  className?: string
  strippedFormatToolbar?: boolean
  // This is a hack to assign special action on media click instead of opening
  // original page e.g. on a preview image click
  onMediaLaunch?: () => void
}) {
  const saveText = async (text: SlateText) => {
    const doc = new TDoc(text)
    await saveNode(doc.toNodeTextData())
  }
  return (
    <NodeCardBox className={className}>
      <NodeMedia ctx={ctx} node={node} onLaunch={onMediaLaunch} />
      <NodeTextEditor
        ctx={ctx}
        node={node}
        saveText={saveText}
        strippedFormatToolbar={strippedFormatToolbar}
      />
    </NodeCardBox>
  )
}

export function NodeCardFetching({
  ctx,
  nid,
  saveNode,
  className,
}: {
  ctx: ElementaryContext
  nid: string
  saveNode: (text: NodeTextData) => Promise<Ack> | undefined
  className?: string
}) {
  const [node, setNode] = useState<TNode | null>(null)
  const fetchNodeAbortController = new AbortController()
  useAsyncEffect(
    async (isMounted) => {
      const n = await ctx.storage.node.get(
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
    <NodeCard ctx={ctx} node={node} saveNode={saveNode} className={className} />
  )
}
