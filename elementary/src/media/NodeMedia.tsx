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
  } else if (node.extattrs && node.isWebBookmark()) {
    return <WebBookmark extattrs={node.extattrs} className={className} />
  }
  return null
}
