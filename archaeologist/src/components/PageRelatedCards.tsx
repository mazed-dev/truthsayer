import React from 'react'
import browser from 'webextension-polyfill'
import styled from '@emotion/styled'

import { TNode } from 'smuggler-api'

import { mazed } from '../util/mazed'
import { kSmallCardWidth } from 'elementary'
import { NodeCard } from './NodeCard'

const Box = styled.div`
  margin: 12px auto 0 auto;
  width: ${kSmallCardWidth}px;
  background-color: white;
  display: block;
`

export const PageRelatedCards = ({ node }: { node: TNode }) => {
  const handleGoToNode = () => {
    browser.tabs.create({
      url: mazed.makeNodeUrl(node.nid).toString(),
    })
  }
  return (
    <Box>
      <NodeCard onClick={handleGoToNode} node={node} />
    </Box>
  )
}
