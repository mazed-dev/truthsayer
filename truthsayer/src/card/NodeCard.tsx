import React, { useState } from 'react'
import { useAsyncEffect } from 'use-async-effect'

import { TNode, NodeTextData, smuggler } from 'smuggler-api'
import { NodeTextEditor } from '../doc/DocEditor'
import { ImageNode } from '../doc/image/ImageNode'
import { WebBookmark } from '../doc/web_bookmark/WebBookmark'
import { SlateText } from '../doc/types'
import { TDoc } from '../doc/doc_util'
import { Spinner } from 'elementary'

import styles from './NodeCard.module.css'

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
    media = <ImageNode className={styles.media} node={node} />
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
