/** @jsxImportSource @emotion/react */

import React, { useCallback, useMemo } from 'react'
import { css } from '@emotion/react'
import { Editable, Slate, withReact } from 'slate-react'
import { createEditor } from 'slate'

import { withTypography } from './plugins/typography.js'
import { withLinks } from './plugins/link.js'
import { withImages } from './plugins/image.js'

import { Leaf } from './components/Leaf.js'

import { TDoc } from './types.js'
import { TNode } from 'smuggler-api'

import { makeElementRender } from './ElementRender.js'

export const NodeTextReader = ({
  className,
  node,
}: {
  node: TNode
  className?: string
}) => {
  const initialValue = useMemo(() => {
    const doc = TDoc.fromNodeTextData(node.getText())
    return doc.slate
  }, [node])
  const renderElement = useCallback(
    (props) => <ReadOnlyElement nid={node.nid} {...props} />,
    [node]
  )
  const renderLeaf = useCallback((props) => <Leaf {...props} />, [node])
  const editor = useMemo(
    () => withTypography(withLinks(withImages(withReact(createEditor())))),
    []
  )
  return (
    <div className={className}>
      <Slate editor={editor} value={initialValue}>
        <Editable
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          readOnly
          css={css`
            padding: 1em 1em 0 1em;
          `}
        />
      </Slate>
    </div>
  )
}

const ReadOnlyElement = makeElementRender(false)
