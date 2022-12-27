import React from 'react'

import { TNode, TNodeUtil } from 'smuggler-api'
import { ImageNode } from './ImageNode'
import { WebBookmark } from './WebBookmark'
import { WebQuote } from './WebQuote'

export function NodeMedia({
  node,
  className,
  strippedRefs,
  strippedActions,
}: {
  node: TNode
  className?: string
  strippedRefs?: boolean
  strippedActions?: boolean
}) {
  const { extattrs } = node
  if (TNodeUtil.isImage(node)) {
    return (
      <ImageNode
        node={node}
        className={className}
        strippedActions={strippedActions}
      />
    )
  } else if (TNodeUtil.isWebBookmark(node)) {
    if (extattrs != null) {
      return (
        <WebBookmark
          extattrs={extattrs}
          strippedRefs={strippedRefs}
          className={className}
        />
      )
    }
  } else if (TNodeUtil.isWebQuote(node)) {
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
