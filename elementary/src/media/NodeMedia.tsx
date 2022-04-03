import React from 'react'

import { TNode } from 'smuggler-api'
import { ImageNode } from './ImageNode'
import { WebBookmark } from './WebBookmark'
import { WebQuote } from './WebQuote'

export function NodeMedia({
  node,
  className,
}: {
  node: TNode
  className?: string
}) {
  const { extattrs, nid } = node
  if (node.isImage()) {
    return <ImageNode node={node} className={className} />
  } else if (node.isWebBookmark()) {
    if (extattrs != null) {
      return <WebBookmark extattrs={extattrs} className={className} />
    }
  } else if (node.isWebQuote()) {
    if (extattrs != null) {
      return <WebQuote nid={nid} extattrs={extattrs} className={className} />
    }
  }
  return null
}
