/** @jsxImportSource @emotion/react */

import React from 'react'
import styled from '@emotion/styled'
import { useAsyncEffect } from 'use-async-effect'

import {
  TDoc,
  ShrinkMinimalCard,
  NodeCardReadOnly,
  truthsayer,
  HoverTooltip,
  Spinner,
} from 'elementary'
import { NodeUtil, StorageApi } from 'smuggler-api'
import type { TNode } from 'smuggler-api'

import { AugmentationElement } from './Mount'
import { MeteredButton } from '../elements/MeteredButton'
import { ContentContext } from '../context'
import { MazedMiniFloater } from './MazedMiniFloater'
import { FromContent } from './../../message/types'
import {
  ContentCopy,
  DragIndicator as DragIndicatorIcon,
  ExpandLess,
  ExpandMore,
  OpenInNew,
  Minimize,
} from '@emotion-icons/material'
import Draggable, { DraggableEvent, DraggableData } from 'react-draggable'
import {} from '@emotion-icons/material'

const SuggestedCardsBox = styled.div`
  width: 320px;
  display: flex;
  flex-direction: column;

  margin: 4px;
  background: #ffffff;
  border-radius: 4px;
  color: black;
  box-shadow: 2px 2px 4px #8c8c8ceb;
`
const DraggableElement = styled.div`
  position: absolute;
  user-select: none;
`

const Header = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  border-bottom: 1px solid #ececec;
`
const HeaderText = styled.div`
  color: #7a7a7a;
  font-size: 14px;
  padding: 4px;
  vertical-align: middle;
`

const SuggestionsFloaterSuggestionsBox = styled.div`
  display: flex;
  flex-direction: column;
  max-height: 80vh;
  padding: 4px 0 4px 0;
  overflow-y: scroll;
`

const SuggestedCardsHeaderIcon = styled.div`
  opacity: 0.32;
  font-size: 12px;
  padding: 0.4em 0.5em 0.4em 0.5em;
  vertical-align: middle;
`
const SuggestionButton = styled(MeteredButton)`
  opacity: 0.32;
  font-size: 12px;
  padding: 0.4em 0.5em 0.4em 0.5em;
  vertical-align: middle;
`

const SuggestedCardBox = styled.div`
  font-size: 12px;

  margin: 1px 4px 1px 4px;

  border: 1px solid #ececec;
  border-radius: 6px;
`

const SuggestedCardTools = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  padding: 0;
`

const CopySuggestionButton = ({
  children,
  onClick,
  tooltip,
}: React.PropsWithChildren<{
  onClick: () => void
  tooltip: string
}>) => {
  const [notification, setNotification] = React.useState<string | null>(null)
  return (
    <SuggestionButton
      onClick={() => {
        if (notification != null) {
          setNotification(null)
        } else {
          onClick()
          setNotification('Copied!')
        }
      }}
      metricLabel={'Suggested Fragment Copy'}
    >
      <HoverTooltip tooltip={tooltip} placement="bottom">
        {notification ?? children}
      </HoverTooltip>
    </SuggestionButton>
  )
}

function getTextToInsert(storage: StorageApi, node: TNode): string {
  let toInsert: string
  if (NodeUtil.isWebBookmark(node) && node.extattrs?.web != null) {
    toInsert = node.extattrs.web.url
  } else if (NodeUtil.isWebQuote(node) && node.extattrs?.web_quote != null) {
    const { text, url } = node.extattrs.web_quote
    const { author } = node.extattrs
    const authorStr = author ? `, by ${author}` : ''
    toInsert = `“${text}”${authorStr} ${url} `
  } else if (NodeUtil.isImage(node)) {
    toInsert = storage.blob.sourceUrl(node.nid)
  } else {
    const doc = TDoc.fromNodeTextData(node.text)
    toInsert = doc.genPlainText()
  }
  return toInsert
}

function CardCopyButton({
  node,
  onClose,
}: {
  node: TNode
  onClose: () => void
}) {
  const ctx = React.useContext(ContentContext)
  let copySubj: string
  if (NodeUtil.isWebBookmark(node) && node.extattrs?.web != null) {
    copySubj = 'Link'
  } else if (NodeUtil.isWebQuote(node) && node.extattrs?.web_quote != null) {
    copySubj = 'Quote'
  } else if (NodeUtil.isImage(node)) {
    copySubj = 'Image'
  } else {
    copySubj = 'Note'
  }
  return (
    <CopySuggestionButton
      onClick={() => {
        const toInsert = getTextToInsert(ctx.storage, node)
        navigator.clipboard.writeText(toInsert)
        onClose()
      }}
      tooltip={`Copy ${copySubj}`}
    >
      <ContentCopy size="14px" />
    </CopySuggestionButton>
  )
}

const SuggestedCard = ({
  node,
  onClose,
}: {
  node: TNode
  onClose: () => void
}) => {
  const [seeMore, setSeeMore] = React.useState<boolean>(false)
  const ctx = React.useContext(ContentContext)
  return (
    <SuggestedCardBox>
      <ShrinkMinimalCard showMore={seeMore} height={'116px'}>
        <NodeCardReadOnly
          node={node}
          strippedRefs
          strippedActions
          storage={ctx.storage}
        />
      </ShrinkMinimalCard>
      <SuggestedCardTools>
        <CardCopyButton node={node} onClose={onClose} />
        <SuggestionButton
          href={truthsayer.url.makeNode(node.nid).toString()}
          metricLabel={'Suggested Fragment Open in Mazed'}
        >
          <HoverTooltip tooltip={'Open in Mazed'} placement="bottom">
            <OpenInNew size="14px" />
          </HoverTooltip>
        </SuggestionButton>
        <SuggestionButton
          onClick={() => setSeeMore((more) => !more)}
          metricLabel={'Suggested Fragment See ' + (seeMore ? 'less' : 'more')}
        >
          <HoverTooltip
            tooltip={seeMore ? 'See less' : 'See more'}
            placement="bottom"
          >
            {seeMore ? <ExpandLess size="14px" /> : <ExpandMore size="14px" />}
          </HoverTooltip>
        </SuggestionButton>
      </SuggestedCardTools>
    </SuggestedCardBox>
  )
}

const NoSuggestedCardsBox = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  align-content: center;
  align-items: flex-start;
  margin: 12px 0 12px 0;
`

const SuggestedCards = ({
  nodes,
  onClose,
  isLoading,
}: {
  nodes: TNode[]
  onClose: () => void
  isLoading: boolean
}) => {
  const suggestedCards = nodes.map((node: TNode) => {
    return <SuggestedCard key={node.nid} node={node} onClose={onClose} />
  })
  return (
    <SuggestedCardsBox>
      <Header id="mazed-archaeologist-suggestions-floater-drag-handle">
        <SuggestedCardsHeaderIcon>
          <DragIndicator size="16px" />
        </SuggestedCardsHeaderIcon>
        <HeaderText>
          ※&nbsp;{isLoading ? <Spinner.Ring /> : nodes.length}
        </HeaderText>
        <MeteredButton
          onClick={onClose}
          metricLabel={'Suggestions Floater Close'}
          css={{ marginRight: '2px', marginTop: '2px' }}
        >
          <HoverTooltip tooltip={'Open in Mazed'} placement="bottom">
            <Minimize size="16px" />
          </HoverTooltip>
        </MeteredButton>
      </Header>
      <SuggestionsFloaterSuggestionsBox>
        {isLoading ? (
          <NoSuggestedCardsBox>
            <Spinner.Ring />
          </NoSuggestedCardsBox>
        ) : null}
        {suggestedCards.length > 0 ? suggestedCards : <NoSuggestedCardsBox />}
      </SuggestionsFloaterSuggestionsBox>
    </SuggestedCardsBox>
  )
}

const DragIndicator = styled(DragIndicatorIcon)`
  cursor: move; /* fallback if "grab" & "grabbing" cursors are not supported */
  cursor: grab;
  &: active {
    cursor: grabbing;
  }
`

const MiniFloaterBox = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  #mazed-archaeologist-suggestions-floater-drag-handle {
    opacity: 0.1;
  }
  &:hover &:active {
    #mazed-archaeologist-suggestions-floater-drag-handle {
      opacity: 1;
    }
  }
`

type Position2D = { x: number; y: number }

/**
 * Position of the floater on veritcal line depends on the width of a floater,
 * because we want it to be always anchored to the rigth edge of the window.
 */
const getStartDragPosition = (isRevealed: boolean): Position2D =>
  isRevealed ? { x: -300, y: 0 } : { x: -32, y: 0 }

/**
 * Make sure that floter is visisble within a window: not too low or too high -
 * right within view frame.
 */
const frameYPosition = (y: number) =>
  Math.max(0, Math.min(y, window.innerHeight - 76))

export const SuggestionsFloater = ({
  nodes,
  isLoading,
}: {
  nodes: TNode[]
  isLoading: boolean
}) => {
  const nodeRef = React.useRef(null)
  const [controlledPosition, setControlledPosition] =
    React.useState<Position2D | null>(null) // getStartDragPosition(false))
  const [isRevealed, setRevealed] = React.useState<boolean>(false)
  const saveRevealed = React.useCallback((revealed: boolean) => {
    setControlledPosition((pos) => {
      const defaultPos = getStartDragPosition(revealed)
      return { x: defaultPos.x, y: pos?.y ?? defaultPos.y }
    })
    setRevealed(revealed)
    FromContent.sendMessage({
      type: 'REQUEST_CONTENT_AUGMENTATION_SETTINGS',
      settings: { isRevealed: revealed },
    })
  }, [])
  useAsyncEffect(async () => {
    const response = await FromContent.sendMessage({
      type: 'REQUEST_CONTENT_AUGMENTATION_SETTINGS',
    })
    const revealed = response.state.isRevealed ?? false
    setRevealed(revealed)
    const defaultPosition = getStartDragPosition(revealed)
    setControlledPosition({
      x: defaultPosition.x,
      y: frameYPosition(response.state.positionY ?? defaultPosition.y),
    })
  }, [])
  const onDragStop = (_e: DraggableEvent, data: DraggableData) => {
    FromContent.sendMessage({
      type: 'REQUEST_CONTENT_AUGMENTATION_SETTINGS',
      settings: { positionY: data.y },
    })
  }
  return (
    <AugmentationElement>
      {controlledPosition != null ? (
        <Draggable
          onStop={onDragStop}
          handle="#mazed-archaeologist-suggestions-floater-drag-handle"
          axis="y"
          defaultPosition={controlledPosition}
          nodeRef={nodeRef}
        >
          <DraggableElement ref={nodeRef}>
            {isRevealed ? (
              <SuggestedCards
                onClose={() => {
                  saveRevealed(false)
                }}
                nodes={nodes}
                isLoading={isLoading}
              />
            ) : (
              <MiniFloaterBox>
                <MazedMiniFloater onClick={() => saveRevealed(true)}>
                  {isLoading ? <Spinner.Ring /> : nodes.length}
                </MazedMiniFloater>
                <DragIndicator
                  id="mazed-archaeologist-suggestions-floater-drag-handle"
                  size="22px"
                />
              </MiniFloaterBox>
            )}
          </DraggableElement>
        </Draggable>
      ) : null}
    </AugmentationElement>
  )
}
