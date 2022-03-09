import React from 'react'

import { TNode, NodeTextData } from 'smuggler-api'
import { NodeTextEditor } from '../doc/DocEditor'
import { ImageNode } from '../doc/image/ImageNode'
import { WebBookmark } from '../doc/web_bookmark/WebBookmark'
import { SlateText } from '../doc/types'
import { TDoc } from '../doc/doc_util'

import { Loader } from '../lib/loader'

import styles from './FullCard.module.css'

export function FullCard({
  node,
  saveNode,
  className,
}: {
  node: TNode
  saveNode?: (text: NodeTextData) => Promise<Response> | undefined
  className?: string
}) {
  let media
  let editor
  if (node == null) {
    editor = <Loader />
  } else {
    const saveText =
      saveNode == null
        ? undefined
        : (text: SlateText) => {
            const doc = new TDoc(text)
            saveNode(doc.toNodeTextData())
          }
    editor = (
      <NodeTextEditor
        className={styles.editor}
        node={node}
        saveText={saveText}
      />
    )
    if (node.isImage()) {
      media = <ImageNode className={styles.media} node={node} />
    } else if (node.extattrs && node.isWebBookmark()) {
      media = <WebBookmark extattrs={node.extattrs} />
    }
  }
  return (
    <div className={className}>
      {media}
      {editor}
    </div>
  )
}
