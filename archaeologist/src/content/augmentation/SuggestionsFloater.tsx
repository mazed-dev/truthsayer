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
import { DragHandle, Minimize } from '@emotion-icons/material-rounded'
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

const DragIndicator = styled(DragHandle)`
  ${DraggableCursorStyles}
  border-radius: 50%;
  fill: #a3c7f3;
`

const MiniFloaterBox = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  position: absolute;

  transform: translate(24px, 0);

  transition-property: transform;
  transition-duration: 0.8s;
  transition-delay: 0.8s;
  transition-timing-function: ease-in-out;
  &:hover {
    transform: translate(0, 0);
  }
  #mazed-archaeologist-suggestions-floater-drag-handle {
    opacity: 0.6;
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
  isRevealed ? { x: -300, y: 72 } : { x: -24, y: 72 }

/**
 * Make sure that floter is visisble within a window: not too low or too high -
 * right within view frame.
 */
const frameYPosition = (y: number) =>
  Math.max(0, Math.min(y, window.innerHeight - 76))

export const SuggestionsFloater = ({
  nodes,
  isLoading,
  defaultRevelaed,
}: {
  nodes: RelevantNodeSuggestion[]
  isLoading: boolean
  defaultRevelaed: boolean
}) => {
  const nodeRef = React.useRef(null)
  const [controlledPosition, setControlledPosition] =
    React.useState<Position2D | null>(null)
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
      await saveContentAugmentationSettings({ isRevealed: revealed })
      setRevealed(revealed)
      // Reset floater position to adjust horisontal position (X), it has only
      // 2 values for revealed/hidden floater. Y position must remain the same.
      setControlledPosition((prev) => {
        const defaultPosition = getStartDragPosition(revealed)
        return {
          x: defaultPosition.x,
          y: frameYPosition(prev?.y ?? defaultPosition.y),
        }
      })
      analytics?.capture('Click SuggestionsFloater visibility toggle', {
        'Event type': 'change',
        isRevealed: revealed,
      })
    },
    [analytics, saveContentAugmentationSettings]
  )

  useAsyncEffect(async () => {
    let settings: ContentAugmentationSettings | null =
      await saveContentAugmentationSettings()
    setSettings(settings)
    const revealed = (settings?.isRevealed ?? false) || defaultRevelaed
    const defaultPosition = getStartDragPosition(revealed)

    setRevealed(revealed)
    setControlledPosition({
      x: defaultPosition.x,
      y: frameYPosition(settings?.positionY ?? defaultPosition.y),
    })
  }, [])
  const onDragStop = (_e: DraggableEvent, data: DraggableData) => {
    const positionY = frameYPosition(data.y)
    saveContentAugmentationSettings({ positionY })
    analytics?.capture('Drag SuggestionsFloater', {
      'Event type': 'drag',
      positionY,
      isRevealed,
    })
  }
  return (
    <AugmentationElement disableInFullscreenMode>
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
              <>
                <SuggestedCards
                  onClose={() => saveRevealed(false)}
                  nodes={nodes}
                  isLoading={isLoading}
                  productUpdateConfig={settings?.productUpdate ?? undefined}
                  updateProductUpdateConfig={async (
                    productUpdate: ContentAugmentationProductUpdate | undefined
                  ) => {
                    saveContentAugmentationSettings({ productUpdate })
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
              </>
            ) : (
              <MiniFloaterBox>
                <MazedMiniFloater
                  onClick={() => saveRevealed(true)}
                  text={
                    nodes.length === 0 ? undefined : nodes.length.toString()
                  }
                />
                <DragIndicator
                  size={26}
                  id="mazed-archaeologist-suggestions-floater-drag-handle"
                />
              </MiniFloaterBox>
            )}
          </DraggableElement>
        </Draggable>
      ) : null}
    </AugmentationElement>
  )
}
