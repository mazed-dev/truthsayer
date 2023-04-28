import React from 'react'

import { NodeUtil } from 'smuggler-api'
import type { TNode, StorageApi } from 'smuggler-api'
import { ImageNode } from './ImageNode'
import { WebBookmark, WebBookmarkDescriptionConfig } from './WebBookmark'
import { WebQuote } from './WebQuote'
import type { ElementaryContext } from '../context'

export function NodeMedia({
  ctx,
  node,
  className,
  strippedRefs,
  strippedActions,
  onLaunch,
  webBookmarkDescriptionConfig,
}: {
  ctx: ElementaryContext
  node: TNode
  className?: string
  strippedRefs?: boolean
  strippedActions?: boolean
  onLaunch?: () => void
  webBookmarkDescriptionConfig?: WebBookmarkDescriptionConfig
}) {
  const { extattrs } = node
  if (NodeUtil.isImage(node)) {
    return (
      <ImageNode
        node={node}
        className={className}
        strippedActions={strippedActions}
        storage={ctx.storage}
        onLaunch={onLaunch}
      />
    )
  } else if (NodeUtil.isWebBookmark(node)) {
    if (extattrs != null) {
      return (
        <WebBookmark
          ctx={ctx}
          extattrs={extattrs}
          strippedRefs={strippedRefs}
          className={className}
          onLaunch={onLaunch}
          webBookmarkDescriptionConfig={webBookmarkDescriptionConfig}
        />
      )
    }
  } else if (NodeUtil.isWebQuote(node)) {
    if (extattrs != null) {
      return (
        <WebQuote
          ctx={ctx}
          extattrs={extattrs}
          strippedRefs={strippedRefs}
          className={className}
          onLaunch={onLaunch}
        />
      )
    }
  }
  return null
}
