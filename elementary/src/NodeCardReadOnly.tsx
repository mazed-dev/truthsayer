import React, { useState } from 'react'
import { useAsyncEffect } from 'use-async-effect'
import styled from '@emotion/styled'

import type { TNode, StorageApi } from 'smuggler-api'
import { productanalytics } from 'armoury'
import { NodeTextReader } from './editor/NodeTextReader'
import { Spinner } from './spinner/mod'
import { NodeMedia } from './media/NodeMedia'
import { WebBookmarkDescriptionConfig } from './media/WebBookmark'

const Box = styled.div`
  border-radius: inherit;
`

export function NodeCardReadOnly({
  node,
  className,
  strippedRefs,
  strippedActions,
  storage,
  captureMetricOnCopy,
  webBookmarkDescriptionConfig,
}: {
  node: TNode
  className?: string
  strippedRefs?: boolean
  strippedActions?: boolean
  storage: StorageApi
  captureMetricOnCopy?: (subj: string) => void
  webBookmarkDescriptionConfig?: WebBookmarkDescriptionConfig
}) {
  return (
    <Box className={productanalytics.classExclude(className)}>
      <NodeMedia
        storage={storage}
        className={''}
        node={node}
        strippedRefs={strippedRefs}
        strippedActions={strippedActions}
        captureMetricOnCopy={captureMetricOnCopy}
        webBookmarkDescriptionConfig={webBookmarkDescriptionConfig}
      />
      <NodeTextReader node={node} captureMetricOnCopy={captureMetricOnCopy} />
    </Box>
  )
}

export function NodeCardReadOnlyFetching({
  nid,
  className,
  strippedRefs,
  strippedActions,
  storage,
}: {
  nid: string
  className?: string
  strippedRefs?: boolean
  strippedActions?: boolean
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
    <NodeCardReadOnly
      node={node}
      strippedRefs={strippedRefs}
      strippedActions={strippedActions}
      className={className}
      storage={storage}
    />
  )
}
