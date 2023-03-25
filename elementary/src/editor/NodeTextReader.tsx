/** @jsxImportSource @emotion/react */

import React, { useCallback, useMemo } from 'react'
import { css } from '@emotion/react'
import { Editable, Slate, withReact } from 'slate-react'
import { createEditor } from 'slate'

import { withTypography } from './plugins/typography'
import { withLinks } from './plugins/link'
import { withImages } from './plugins/image'

import { Leaf } from './components/Leaf'

import { TDoc } from './types'
import type { TNode } from 'smuggler-api'

import { makeElementRender } from './ElementRender'
import { OverlayCopyOnHover } from '../OverlayCopyOnHover'
import { productanalytics } from 'armoury'

export const NodeTextReader = ({
  className,
  node,
  captureMetricOnCopy,
}: {
  node: TNode
  className?: string
  captureMetricOnCopy?: (subj: string) => void
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
        <OverlayCopyOnHover
          getTextToCopy={() => {
            captureMetricOnCopy?.('comment')
            return initialValue.genPlainText()
          }}
        >
          <Slate editor={editor} value={initialValue.slate}>
            <Editable
              renderElement={renderElement}
              renderLeaf={renderLeaf}
              readOnly
              css={css`
                padding: 0 0.8em 0.8em 0.8em;
              `}
              className={productanalytics.classExclude()}
            />
          </Slate>
        </OverlayCopyOnHover>
      )}
    </div>
  )
}

const ReadOnlyElement = makeElementRender(false)
