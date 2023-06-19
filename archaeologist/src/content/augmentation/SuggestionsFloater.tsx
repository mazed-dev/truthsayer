/** @jsxImportSource @emotion/react */

import React from 'react'
import styled from '@emotion/styled'
import { useAsyncEffect } from 'use-async-effect'

import {
  HoverTooltip,
  ImgButton,
  Spinner,
  WebBookmarkDescriptionConfig,
  ScopedTimedAction,
} from 'elementary'
import type { TNode, NodeBlockKey } from 'smuggler-api'
import { NodeUtil } from 'smuggler-api'

import { AugmentationElement } from './Mount'
import { ContentContext } from '../context'
import { MazedMiniFloater } from './MazedMiniFloater'
import { SuggestedCard } from './SuggestedCard'
import { ProductUpdateCard } from './ProductUpdateCard'
import {
  ContentAugmentationSettings,
  FromContent,
  ContentAugmentationProductUpdate,
} from './../../message/types'
import { Minimize } from '@emotion-icons/material-rounded'
import Draggable, { DraggableEvent, DraggableData } from 'react-draggable'
import { errorise, productanalytics } from 'armoury'
import moment from 'moment'

const SuggestedCardsBox = styled.div`
  width: 320px;
  display: flex;
  flex-direction: column;

  background: #eeeeefdb;
  box-shadow: 0 2px 5px 2px rgba(60, 64, 68, 0.16);
  &:hover,
  &:active {
    background: #eeeeef;
    box-shadow: 0 2px 8px 2px rgba(60, 64, 68, 0.24);
  }
  border-radius: 6px;
  user-select: text;
`

const LineLoader = styled(Spinner.Line)`
  width: 320px;
`

const DraggableCursorStyles = `
  cursor: move; /* fallback if "grab" & "grabbing" cursors are not supported */
  cursor: grab;
  &:active {
    cursor: grabbing;
  }
`

const DraggableElement = styled.div`
  position: absolute;
  user-select: none;
`

const Header = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  ${DraggableCursorStyles}
`
const Footter = styled.div`
  height: 8px;
  ${DraggableCursorStyles}
`

const SuggestionsFloaterSuggestionsBox = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow-y: scroll;
  max-height: 80vh;

  border-radius: 6px;
  user-select: text;
`

const FloateHeaderBtn = styled(ImgButton)`
  padding: 3px;
  margin: 1px 5px 0 5px;
  font-size: 12px;
  vertical-align: middle;
  background: unset;
  border-radius: 12px;
`

export type RelevantNodeSuggestion = {
  node: TNode
  matchedQuotes: NodeBlockKey[]
  score: number
}

const NoSuggestedCardsBox = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  align-content: center;
  align-items: flex-start;
  margin: 12px 0 12px 0;
`

function getMatchingText({
  node,
  matchedQuotes,
}: RelevantNodeSuggestion): WebBookmarkDescriptionConfig {
  if (!NodeUtil.isWebBookmark(node) || !matchedQuotes) {
    return { type: 'none' }
  }
  return { type: 'direct-quotes', blocks: matchedQuotes }
}

type SuggestedCardsProps = {
  nodes: RelevantNodeSuggestion[]
  onClose: () => void
  isLoading: boolean
  productUpdateConfig?: ContentAugmentationProductUpdate
  updateProductUpdateConfig: (
    update: ContentAugmentationProductUpdate | undefined
  ) => Promise<void>
}

const SuggestedCards = ({
  nodes,
  onClose,
  isLoading,
  productUpdateConfig,
  updateProductUpdateConfig,
}: SuggestedCardsProps) => {
  const analytics = React.useContext(ContentContext).analytics
  React.useEffect(() => {
    analytics?.capture('Show suggested associations', {
      'Event type': 'show',
      count: nodes.length,
    })
  }, [nodes, analytics])
  const suggestedCards = nodes.map((relevantNodeSuggestion) => {
    return (
      <SuggestedCard
        key={relevantNodeSuggestion.node.nid}
        node={relevantNodeSuggestion.node}
        webBookmarkDescriptionConfig={getMatchingText(relevantNodeSuggestion)}
      />
    )
  })
  return (
    <SuggestedCardsBox>
      <Header id="mazed-archaeologist-suggestions-floater-drag-handle">
        <FloateHeaderBtn onClick={onClose}>
          <HoverTooltip tooltip="Minimize" placement="bottom">
            <Minimize size="16px" />
          </HoverTooltip>
        </FloateHeaderBtn>
      </Header>
      {isLoading ? <LineLoader /> : null}
      <SuggestionsFloaterSuggestionsBox>
        <ProductUpdateCard
          productUpdateConfig={productUpdateConfig}
          updateProductUpdateConfig={updateProductUpdateConfig}
        />
        {suggestedCards.length > 0 ? suggestedCards : <NoSuggestedCardsBox />}
      </SuggestionsFloaterSuggestionsBox>
      <Footter id="mazed-archaeologist-suggestions-floater-drag-handle" />
    </SuggestedCardsBox>
  )
}

const MiniFloaterBox = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`

type Position2D = { x: number; y: number }

function MiniFloater({
  onClick,
  text,
  position,
}: {
  onClick: () => void
  text?: string
  position: Position2D
}) {
  return (
    <MiniFloaterBox
      css={{ transform: `translate(${position.x}px, ${position.y}px)` }}
    >
      <MazedMiniFloater onClick={onClick} text={text} />
    </MiniFloaterBox>
  )
}

export type ControlledPosition = {
  offset: Position2D
  parentElement: Element | null
}

/**
 * Make sure that opened floter is visisble within a window viewframe.
 */
const frameOpenFloaterPosition = (pos?: Position2D) => {
  const { x, y } = pos ?? { x: window.innerWidth - 328, y: 72 }
  return {
    x: Math.max(0, Math.min(x - 150, window.innerWidth - 328)),
    y: Math.max(0, Math.min(y, window.innerHeight / 2)),
  }
}

/**
 * Make sure that min-floter is visisble within a window viewframe.
 */
const frameMinFloaterPosition = (pos?: Position2D) => {
  const { x, y } = pos ?? { x: window.innerWidth - 32, y: 72 }
  return {
    x: Math.max(0, Math.min(x, window.innerWidth - 24)),
    y: Math.max(0, Math.min(y, window.innerHeight - 24)),
  }
}

export const SuggestionsFloater = ({
  nodes,
  isLoading,
  defaultRevelaed,
  controlledPosition,
}: {
  nodes: RelevantNodeSuggestion[]
  isLoading: boolean
  defaultRevelaed: boolean
  controlledPosition: ControlledPosition | null
}) => {
  const nodeRef = React.useRef(null)
  // Floater can be open by default **only** if there is something to suggest.
  defaultRevelaed = defaultRevelaed && nodes.length > 0
  const [isRevealed, setRevealed] = React.useState<boolean>(defaultRevelaed)
  const [settings, setSettings] =
    React.useState<ContentAugmentationSettings | null>(null)

  const analytics = React.useContext(ContentContext).analytics

  const saveContentAugmentationSettings = React.useCallback(
    async (settingsUpdate?: ContentAugmentationSettings) => {
      let settings: ContentAugmentationSettings | null = null
      try {
        const response = await FromContent.sendMessage({
          type: 'REQUEST_CONTENT_AUGMENTATION_SETTINGS',
          settings: settingsUpdate,
        })
        settings = response.state
      } catch (e) {
        productanalytics.warning(
          analytics ?? null,
          {
            failedTo: 'update user settings',
            location: 'floater',
            cause: errorise(e).message,
          },
          { andLog: true }
        )
      }
      return settings
    },
    [analytics]
  )
  const saveRevealed = React.useCallback(
    async (revealed: boolean) => {
      setRevealed(revealed)
      analytics?.capture('Click SuggestionsFloater visibility toggle', {
        'Event type': 'change',
        isRevealed: revealed,
      })
    },
    [analytics]
  )

  useAsyncEffect(async () => {
    let settings: ContentAugmentationSettings | null =
      await saveContentAugmentationSettings()
    setSettings(settings)
  }, [])
  const onDragStop = (_e: DraggableEvent, data: DraggableData) => {
    // Ideally, opened floate shoul neve be dragged, if we calculated it's
    // possition good enough in `frameOpenFloaterPosition`, measure it to test
    // the theory.
    analytics?.capture('Drag SuggestionsFloater', {
      'Event type': 'drag',
      positionY: data.y,
      isRevealed,
    })
  }
  return (
    <AugmentationElement disableInFullscreenMode>
      {isRevealed ? (
        <Draggable
          onStop={onDragStop}
          handle="#mazed-archaeologist-suggestions-floater-drag-handle"
          defaultPosition={frameOpenFloaterPosition(controlledPosition?.offset)}
          nodeRef={nodeRef}
        >
          <DraggableElement ref={nodeRef}>
            <SuggestedCards
              onClose={() => saveRevealed(false)}
              nodes={nodes}
              isLoading={isLoading}
              productUpdateConfig={settings?.productUpdate ?? undefined}
              updateProductUpdateConfig={async (
                productUpdate: ContentAugmentationProductUpdate | undefined
              ) => {
                await saveContentAugmentationSettings({ productUpdate })
              }}
            />
            <ScopedTimedAction
              action={() =>
                analytics?.capture(
                  'SuggestionsFloater: kept open longer than threshold',
                  { thresholdSec: 15 }
                )
              }
              after={moment.duration(15, 'seconds')}
            />
          </DraggableElement>
        </Draggable>
      ) : (
        <MiniFloater
          onClick={() => saveRevealed(true)}
          text={nodes.length === 0 ? undefined : nodes.length.toString()}
          position={frameMinFloaterPosition(controlledPosition?.offset)}
        />
      )}
    </AugmentationElement>
  )
}
