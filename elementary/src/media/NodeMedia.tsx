import React from 'react'

import { TNode } from 'smuggler-api'
import { ImageNode } from './ImageNode'
import { WebBookmark } from './WebBookmark'

export function NodeMedia({
  node,
  className,
}: {
  node: TNode
  className?: string
}) {
  if (node.isImage()) {
    return <ImageNode node={node} className={className} />
  } else if (node.isWebBookmark()) {
    const { extattrs } = node
    if (extattrs != null) {
      return <WebBookmark extattrs={extattrs} className={className} />
    }
  }
  return null
}
