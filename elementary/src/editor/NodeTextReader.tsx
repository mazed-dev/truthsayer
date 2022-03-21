/** @jsxImportSource @emotion/react */

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { css } from '@emotion/react'
import { Editable, Slate, withReact } from 'slate-react'
import type { Descendant } from 'slate'
import { createEditor } from 'slate'

import { withTypography } from './plugins/typography'
import { withLinks } from './plugins/link'
import { withDateTime } from './plugins/datetime'
import { withImages } from './plugins/image'

import { Leaf } from './components/Leaf'

import { TDoc } from './types'
import { TNode } from 'smuggler-api'

import { makeElementRender } from './ElementRender'

export const NodeTextReader = ({
  className,
  node,
}: {
  node: TNode
  className?: string
}) => {
  const [value, setValue] = useState<Descendant[]>([])
  useEffect(() => {
    const doc = TDoc.fromNodeTextData(node.text)
    setValue(doc.slate)
  }, [node])
  const renderElement = useCallback(
    (props) => <ReadOnlyElement nid={node.nid} {...props} />,
    [node]
  )
  const renderLeaf = useCallback((props) => <Leaf {...props} />, [node])
  const editor = useMemo(
    () =>
      withTypography(
        withLinks(withDateTime(withImages(withReact(createEditor()))))
      ),
    []
  )
  return (
    <div className={className}>
      <Slate
        editor={editor}
        value={value}
        onChange={(value) => setValue(value)}
      >
        <Editable
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          readOnly
          css={css`
            padding: 1em;
          `}
        />
      </Slate>
    </div>
  )
}

const ReadOnlyElement = makeElementRender(false)
