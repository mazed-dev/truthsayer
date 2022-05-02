import React from 'react'

import { TNode } from 'smuggler-api'
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
  if (node.isImage()) {
    return (
      <ImageNode
        node={node}
        className={className}
        strippedActions={strippedActions}
      />
    )
  } else if (node.isWebBookmark()) {
    if (extattrs != null) {
      return (
        <WebBookmark
          extattrs={extattrs}
          strippedRefs={strippedRefs}
          className={className}
        />
      )
    }
  } else if (node.isWebQuote()) {
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
