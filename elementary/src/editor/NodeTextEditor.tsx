/** @jsxImportSource @emotion/react */

import React, { useCallback, useMemo } from 'react'

import { Slate, withReact } from 'slate-react'
import { EditableStyled } from './SlateStyled'
import { createEditor } from 'slate'

import { withHistory } from 'slate-history'

import { withTypography } from './plugins/typography'
import { withShortcuts } from './plugins/shortcuts'
import { withLinks } from './plugins/link'
import { withImages } from './plugins/image'

import { Leaf } from './components/Leaf'

import { FormatToolbar } from './FormatToolbar'
import { TDoc, SlateText } from './types'
import type { TNode } from 'smuggler-api'

import { makeElementRender } from './ElementRender'
import { productanalytics } from 'armoury'
import { ElementaryContext } from '../context'

export const NodeTextEditor = ({
  className,
  node,
  saveText,
  strippedFormatToolbar,
}: {
  ctx: ElementaryContext
  node: TNode
  saveText: (text: SlateText) => void
  className?: string
  strippedFormatToolbar?: boolean
}) => {
  const nid = node.nid
  const renderElement = useCallback(
    (props) => {
      return <EditableElement nid={nid} {...props} />
    },
    [nid]
  )
  const renderLeaf = useCallback((props) => {
    return <Leaf {...props} />
  }, [])
  const editor = useMemo(() => {
    return withHistory(
      withTypography(
        withLinks(
          withImages(withShortcuts(withReact(withHistory(createEditor()))))
        )
      )
    )
  }, [])
  const initialValue = useMemo(() => {
    const doc = TDoc.fromNodeTextData(node.text)
    // TODO(akindyakov): Verify that result slate tree is valid, otherwise the
    // whole app would crash. Slate doesn't really like invalid docs.
    return doc.slate
  }, [nid])
  return (
    <div className={className}>
      <Slate
        editor={editor}
        value={initialValue}
        onChange={(value) => {
          const isAstChange = editor.operations.some(
            (op) => op.type !== 'set_selection'
          )
          if (isAstChange) {
            // Save the value to remote
            saveText(value)
          }
        }}
      >
        {strippedFormatToolbar ? null : <FormatToolbar />}
        <EditableStyled
          className={productanalytics.classExclude()}
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          spellCheck
          autoFocus
        />
      </Slate>
    </div>
  )
}

const EditableElement = makeElementRender(true)
