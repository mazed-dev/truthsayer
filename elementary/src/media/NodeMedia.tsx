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
  onLaunch,
  onCopy,
}: {
  node: TNode
  className?: string
  strippedRefs?: boolean
  strippedActions?: boolean
  storage: StorageApi
  // This is a hack to assign special action on media click instead of opening
  // original page e.g. on a preview image click
  onLaunch?: () => void
  // This is a hack to run extra actions on copying content from node fields
  onCopy?: (subj: string) => void
}) {
  const { extattrs } = node
  if (NodeUtil.isImage(node)) {
    return (
      <ImageNode
        node={node}
        className={className}
        strippedActions={strippedActions}
        storage={storage}
        onLaunch={onLaunch}
      />
    )
  } else if (NodeUtil.isWebBookmark(node)) {
    if (extattrs != null) {
      return (
        <WebBookmark
          extattrs={extattrs}
          strippedRefs={strippedRefs}
          className={className}
          onLaunch={onLaunch}
          onCopy={onCopy}
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
          onLaunch={onLaunch}
          onCopy={onCopy}
        />
      )
    }
  }
  return null
}
