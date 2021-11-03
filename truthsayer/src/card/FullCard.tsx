import React from 'react'

import { FullCardFootbar } from './FullCardFootbar'
import { WideCard } from './WideCard'

import { DocEditor } from '../doc/DocEditor'
import { ImageNode } from '../doc/image/ImageNode'
import { SlateText } from '../doc/types'
import { TDoc } from '../doc/doc_util'

import { Loader } from '../lib/loader'

import styles from './FullCard.module.css'

export function FullCard({ node, addRef, stickyEdges, saveNode }) {
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
