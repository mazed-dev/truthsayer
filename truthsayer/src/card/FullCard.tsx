import React from 'react'

import { FullCardFootbar } from './FullCardFootbar'
import { WideCard } from './WideCard'

import { TEdge, TNode, NodeTextData } from 'smuggler-api'
import { DocEditor } from '../doc/DocEditor'
import { ImageNode } from '../doc/image/ImageNode'
import { WebBookmark } from '../doc/web_bookmark/WebBookmark'
import { SlateText } from '../doc/types'
import { TDoc } from '../doc/doc_util'

import { Loader } from '../lib/loader'

import styles from './FullCard.module.css'

import { log } from 'armoury'

export function FullCard({
  node,
  addRef,
  stickyEdges,
  saveNode,
}: {
  node: TNode
  addRef: (from: string, to: string) => void
  stickyEdges: TEdge[]
  saveNode: (text: NodeTextData) => Promise<Response>
}) {
  let media
  let editor
  if (node == null) {
    editor = <Loader />
  } else {
    const saveText = (text: SlateText) => {
      const doc = new TDoc(text)
      saveNode(doc.toNodeTextData())
    }
    editor = (
      <DocEditor className={styles.editor} node={node} saveText={saveText} />
    )
    if (node.isImage()) {
      media = <ImageNode className={styles.media} node={node} />
    } else if (node.extattrs && node.isWebBookmark()) {
      media = <WebBookmark extattrs={node.extattrs} />
    }
  }
  const reloadNode = () => {}
  return (
    <WideCard>
      {media}
      {editor}
      <FullCardFootbar
        addRef={addRef}
        node={node}
        stickyEdges={stickyEdges}
        reloadNode={reloadNode}
      />
    </WideCard>
  )
}
