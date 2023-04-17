import React, { useContext } from 'react'
import browser from 'webextension-polyfill'

import styled from '@emotion/styled'
import {
  SmallCard,
  ShrinkCard,
  NodeTimeBadge,
  NodeCard,
  NodeCardReadOnly,
  truthsayer,
} from 'elementary'

import type { Ack, NodeTextData, TNode } from 'smuggler-api'
import { NodeUtil } from 'smuggler-api'
import { PopUpContext } from './context'

const BoxEditor = styled(SmallCard)`
  width: 100%;
`
const Box = styled(BoxEditor)`
  cursor: pointer;
`
const FixedShrinkCard = styled(ShrinkCard)`
  height: min-content;
  max-height: 142px;
`
export const NodeEditor = ({
  node,
  saveNode,
  className,
}: {
  node: TNode
  saveNode: (text: NodeTextData) => Promise<void>
  className?: string
}) => {
  const ctx = useContext(PopUpContext)
  return (
    <BoxEditor className={className}>
      <NodeCard
        node={node}
        storage={ctx.storage}
        saveNode={async (text: NodeTextData): Promise<Ack> => {
          await saveNode(text)
          return { ack: true }
        }}
        strippedFormatToolbar
        onMediaLaunch={() =>
          browser.tabs.create({
            // Open Bookmark in Truthsayer Web App, on click on Media.
            // No reason to open an original page, because the page is already
            // in front of the user.
            url: truthsayer.url.makeNode(node.nid).toString(),
          })
        }
      />
      <NodeTimeBadge
        created_at={node.created_at}
        updated_at={node.updated_at}
      />
    </BoxEditor>
  )
}

export const NodeReadOnly = ({
  node,
  className,
}: {
  node: TNode
  className?: string
}) => {
  const ctx = useContext(PopUpContext)
  return (
    <Box className={className}>
      <FixedShrinkCard
        onClick={() =>
          browser.tabs.create({
            url:
              NodeUtil.getOriginalUrl(node) ??
              truthsayer.url.makeNode(node.nid).toString(),
          })
        }
      >
        <NodeCardReadOnly
          node={node}
          storage={ctx.storage}
          webBookmarkDescriptionConfig={{ type: 'none' }}
          strippedRefs
          strippedActions
        />
      </FixedShrinkCard>
      <NodeTimeBadge
        created_at={node.created_at}
        updated_at={node.updated_at}
      />
    </Box>
  )
}
