import React, { useState } from 'react'
import { useAsyncEffect } from 'use-async-effect'

import { TNode, NodeTextData, smuggler } from 'smuggler-api'
import { NodeTextEditor } from './editor/NodeTextEditor'
import { SlateText, TDoc } from './editor/types'
import { ImageNode } from './ImageNode'
import { Spinner } from './spinner/mod'
import { WebBookmark } from './WebBookmark'

export function NodeCard({
  node,
  saveNode,
  className,
}: {
  node: TNode
  saveNode?: (text: NodeTextData) => Promise<Response> | undefined
  className?: string
}) {
  const saveText =
    saveNode == null
      ? undefined
      : (text: SlateText) => {
          const doc = new TDoc(text)
          saveNode(doc.toNodeTextData())
        }
  let media
  if (node.isImage()) {
    media = <ImageNode node={node} />
  } else if (node.extattrs && node.isWebBookmark()) {
    media = <WebBookmark extattrs={node.extattrs} />
  }
  return (
    <div className={className}>
      {media}
      <NodeTextEditor node={node} saveText={saveText} />
    </div>
  )
}

export function NodeCardFetching({
  nid,
  saveNode,
  className,
}: {
  nid: string
  saveNode?: (text: NodeTextData) => Promise<Response> | undefined
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
