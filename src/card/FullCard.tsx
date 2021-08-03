import React from 'react'

import { FullCardFootbar } from './FullCardFootbar'
import { WideCard } from './WideCard'

import { DocEditor } from '../doc/DocEditor.tsx'
import { ImageNode } from '../doc/image/ImageNode'

import { Loader } from '../lib/loader'

import { debug } from './../util/log'

import styles from './FullCard.module.css'

export function FullCard({ node, addRef, stickyEdges, saveNode }) {
  let media
  let editor
  if (node == null) {
    editor = <Loader />
  } else {
    const { data, nid } = node
    const saveText = (text) => {
      node.data = data.updateText(text)
      saveNode(node)
    }
    editor = (
      <DocEditor
        className={styles.editor}
        nid={nid}
        doc={data}
        saveText={saveText}
      />
    )
    if (node.isImage()) {
      media = <ImageNode className={styles.media} nid={nid} data={data} />
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
