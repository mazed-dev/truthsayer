/** @jsxImportSource @emotion/react */

import React, { useEffect, useState, useCallback, useMemo } from 'react'

import { css } from '@emotion/react'
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
import { TNode } from 'smuggler-api'

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
  const [isJinnShown, setShowJinn] = useState<boolean>(false)
  const nid = node.nid
  useEffect(() => {
    const doc = TDoc.fromNodeTextData(node.getText())
    setValue(doc.slate)
  }, [nid])
  const renderElement = useCallback(
    (props) => <EditableElement nid={nid} {...props} />,
    [nid]
  )
  const renderLeaf = useCallback((props) => <Leaf {...props} />, [nid])
  const editor = useMemo(
    () =>
      withJinn(
        () => setShowJinn(true),
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
      <Jinn
        isShown={isJinnShown}
        onHide={() => setShowJinn(false)}
        editor={editor}
      />
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
          css={css`
            padding: 1em 1em 0 1em;
          `}
        />
      </Slate>
    </div>
  )
}

const EditableElement = makeElementRender(true)
