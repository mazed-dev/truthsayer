/** @jsxImportSource @emotion/react */

import React, { useCallback, useMemo } from 'react'
import { Slate, withReact } from 'slate-react'
import { EditableStyled } from './SlateStyled'
import { createEditor } from 'slate'

import { withTypography } from './plugins/typography'
import { withLinks } from './plugins/link'
import { withImages } from './plugins/image'

import { Leaf } from './components/Leaf'

import { TDoc } from './types'
import type { TNode } from 'smuggler-api'

import { makeElementRender } from './ElementRender'
import { productanalytics } from 'armoury'

export const NodeTextReader = ({
  className,
  node,
}: {
  node: TNode
  className?: string
}) => {
  const initialValue = useMemo(() => {
    const doc = TDoc.fromNodeTextData(node.text)
    return doc
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
      {initialValue.getTextLength() === 0 ? null : (
        <Slate editor={editor} value={initialValue.slate}>
          <EditableStyled
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            readOnly
            className={productanalytics.classExclude()}
          />
        </Slate>
      )}
    </div>
  )
}

const ReadOnlyElement = makeElementRender(false)
