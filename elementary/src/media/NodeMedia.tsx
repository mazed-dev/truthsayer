import React from 'react'

import { NodeUtil } from 'smuggler-api'
import type { TNode, StorageApi } from 'smuggler-api'
import { ImageNode } from './ImageNode'
import { WebBookmark } from './WebBookmark'
import { WebQuote } from './WebQuote'

export function NodeMedia({
  node,
  className,
  strippedRefs,
  strippedActions,
  storage,
}: {
  node: TNode
  className?: string
  strippedRefs?: boolean
  strippedActions?: boolean
  storage: StorageApi
}) {
  const { extattrs } = node
  if (NodeUtil.isImage(node)) {
    return (
      <ImageNode
        node={node}
        className={className}
        strippedActions={strippedActions}
        storage={storage}
      />
    )
  } else if (NodeUtil.isWebBookmark(node)) {
    if (extattrs != null) {
      return (
        <WebBookmark
          extattrs={extattrs}
          strippedRefs={strippedRefs}
          className={className}
        />
      )
    }
  } else if (NodeUtil.isWebQuote(node)) {
    if (extattrs != null) {
      return (
        <WebQuote
          extattrs={extattrs}
          strippedRefs={strippedRefs}
          className={className}
        />
      )
    }
  }
  return null
}
