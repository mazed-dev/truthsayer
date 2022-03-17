// @ts-nocheck

import React, { useState, useCallback, useMemo } from 'react'
import { useAsyncEffect } from 'use-async-effect'
import { Editable, Slate, withReact } from 'slate-react'
import { createEditor } from 'slate'

import { withHistory } from 'slate-history'

import { withJinn, Jinn } from './plugins/jinn'
import { withTypography } from './plugins/typography'
import { withShortcuts } from './plugins/shortcuts'
import { withLinks } from './plugins/link'
import { withDateTime } from './plugins/datetime'
import { withImages } from './plugins/image'

import { Leaf } from './components/Leaf'

import { FormatToolbar } from './FormatToolbar'
import { TDoc, SlateText } from './types'

import { makeElementRender } from './ElementRender'

export const NodeTextEditor = ({
  className,
  node,
  saveText,
}: {
  node: TNode
  saveText: (text: SlateText) => void
  className?: string
}) => {
  const [value, setValue] = useState<SlateText>([])
  const [showJinn, setShowJinn] = useState<boolean>(false)
  const nid = node.nid
  useAsyncEffect(
    async (isMounted) => {
      const doc = await TDoc.fromNodeTextData(node.getText())
      if (isMounted()) {
        setValue(doc.slate)
      }
    },
    [nid]
  )
  const renderElement = useCallback(
    (props) => <EditableElement nid={nid} {...props} />,
    [nid]
  )
  const renderLeaf = useCallback((props) => <Leaf {...props} />, [nid])
  const editor = useMemo(
    () =>
      withJinn(
        setShowJinn,
        withTypography(
          withLinks(
            withDateTime(
              withImages(withShortcuts(withReact(withHistory(createEditor()))))
            )
          )
        )
      ),
    []
  )
  return (
    <div className={className}>
      <Jinn show={showJinn} setShow={setShowJinn} editor={editor} />
      <Slate
        editor={editor}
        value={value}
        onChange={(value) => {
          setValue(value)
          // Save the value to remote
          saveText(value)
        }}
      >
        <FormatToolbar />
        <Editable
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
