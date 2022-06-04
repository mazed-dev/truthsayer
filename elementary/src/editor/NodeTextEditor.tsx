/** @jsxImportSource @emotion/react */

import { useState, useCallback, useMemo } from 'react'

import { css } from '@emotion/react'
import { Editable, Slate, withReact } from 'slate-react'
import { createEditor } from 'slate'

import { withHistory } from 'slate-history'

import { withJinn, Jinn } from './plugins/jinn'
import { withTypography } from './plugins/typography'
import { withShortcuts } from './plugins/shortcuts'
import { withLinks } from './plugins/link'
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
  const [isJinnShown, setShowJinn] = useState<boolean>(false)
  const nid = node.nid
  const renderElement = useCallback(
    (props) => {
      return <EditableElement nid={nid} {...props} />
    },
    [nid]
  )
  const renderLeaf = useCallback(
    (props) => {
      return <Leaf {...props} />
    },
    []
  )
  const editor = useMemo(() => {
    return withHistory(
      withJinn(
        () => setShowJinn(true),
        withTypography(
          withLinks(
            withImages(withShortcuts(withReact(withHistory(createEditor()))))
          )
        )
      )
    )
  }, [])
  const initialValue = useMemo(() => {
    const doc = TDoc.fromNodeTextData(node.getText())
    return doc.slate
  }, [nid])
  return (
    <div className={className}>
      <Jinn
        isShown={isJinnShown}
        onHide={() => setShowJinn(false)}
        editor={editor}
      />
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
