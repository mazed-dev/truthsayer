import React, { useState } from 'react'
import { useAsyncEffect } from 'use-async-effect'
import styled from '@emotion/styled'

import type { TNode } from 'smuggler-api'
import { productanalytics } from 'armoury'
import { NodeTextReader } from './editor/NodeTextReader'
import { Spinner } from './spinner/mod'
import { NodeMedia } from './media/NodeMedia'
import { WebBookmarkDescriptionConfig } from './media/WebBookmark'
import { ElementaryContext } from './context'

export const NodeCardBox = styled.div`
  border-radius: inherit;
`

export function NodeCardReadOnly({
  ctx,
  node,
  className,
  strippedRefs,
  strippedActions,
  webBookmarkDescriptionConfig,
}: {
  ctx: ElementaryContext
  node: TNode
  className?: string
  strippedRefs?: boolean
  strippedActions?: boolean
  webBookmarkDescriptionConfig?: WebBookmarkDescriptionConfig
}) {
  return (
    <NodeCardBox className={productanalytics.classExclude(className)}>
      <NodeMedia
        ctx={ctx}
        className={''}
        node={node}
        strippedRefs={strippedRefs}
        strippedActions={strippedActions}
        webBookmarkDescriptionConfig={webBookmarkDescriptionConfig}
      />
      <NodeTextReader node={node} />
    </NodeCardBox>
  )
}

export function NodeCardReadOnlyFetching({
  ctx,
  nid,
  className,
  strippedRefs,
  strippedActions,
}: {
  ctx: ElementaryContext
  nid: string
  className?: string
  strippedRefs?: boolean
  strippedActions?: boolean
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
    <NodeCardReadOnly
      ctx={ctx}
      node={node}
      strippedRefs={strippedRefs}
      strippedActions={strippedActions}
      className={className}
    />
  )
}
