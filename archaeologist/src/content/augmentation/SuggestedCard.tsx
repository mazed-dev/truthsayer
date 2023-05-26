/** @jsxImportSource @emotion/react */

import React from 'react'
import styled from '@emotion/styled'

import { NodeCardReadOnly, WebBookmarkDescriptionConfig } from 'elementary'
import type { TNode } from 'smuggler-api'

import { ContentContext } from '../context'

export const SuggestedCardBox = styled.div`
  color: #484848;
  font-size: 12px;
  font-family: 'Roboto', Helvetica, Arial, sans-serif;
  letter-spacing: -0.01em;
  line-height: 142%;
  text-align: left;

  overflow-wrap: break-word;
  word-break: normal;

  margin: 2px 4px 2px 4px;
  padding-bottom: 5px;
  &:last-child {
    margin: 2px 4px 0px 4px;
  }

  background: #ffffff;
  border-radius: 6px;

  user-select: auto;
`

export const SuggestedCard = ({
  node,
  webBookmarkDescriptionConfig,
}: {
  node: TNode
  webBookmarkDescriptionConfig?: WebBookmarkDescriptionConfig
}) => {
  const ctx = React.useContext(ContentContext)
  return (
    <SuggestedCardBox>
      <NodeCardReadOnly
        ctx={ctx}
        node={node}
        strippedActions
        webBookmarkDescriptionConfig={webBookmarkDescriptionConfig}
      />
    </SuggestedCardBox>
  )
}
