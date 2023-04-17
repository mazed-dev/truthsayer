/** @jsxImportSource @emotion/react */

import React from 'react'
import styled from '@emotion/styled'
import { useAsyncEffect } from 'use-async-effect'

import {
  HoverTooltip,
  ImgButton,
  NodeCardReadOnly,
  Spinner,
  WebBookmarkDescriptionConfig,
} from 'elementary'
import type { TNode } from 'smuggler-api'
import { NodeUtil } from 'smuggler-api'
import type { LongestCommonContinuousPiece } from 'text-information-retrieval'

import { AugmentationElement } from './Mount'
import { ContentContext } from '../context'
import { MazedMiniFloater } from './MazedMiniFloater'
import { ContentAugmentationSettings, FromContent } from './../../message/types'
import { DragHandle, Minimize } from '@emotion-icons/material'
import Draggable, { DraggableEvent, DraggableData } from 'react-draggable'
import { errorise, productanalytics } from 'armoury'

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

const CloseBtn = styled(ImgButton)`
  padding: 3px 4px 3px 4px;
  margin: 1px 5px 0 5px;
  font-size: 12px;
  vertical-align: middle;
  background: unset;
  border-radius: 12px;
`

const SuggestedCardBox = styled.div`
  color: #484848;
  font-size: 12px;
  letter-spacing: -0.01em;
  line-height: 142%;
  text-align: left;

  margin: 2px 4px 2px 4px;
  &:last-child {
    margin: 2px 4px 0px 4px;
  }

  background: #ffffff;
  border-radius: 6px;
  user-select: text;
`
// FIXME(Alexander): Use `RelevantNodeSuggestion` struct from /message/types.ts
export type RelevantNodeSuggestion = {
  node: TNode
  matchedPiece?: LongestCommonContinuousPiece
}

const SuggestedCard = ({
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
        node={node}
        strippedActions
        storage={ctx.storage}
        captureMetricOnCopy={(subj: string) => {
          ctx.analytics?.capture('Button:Click Suggested Fragment Copy', {
            text: subj,
            'Event type': 'click',
          })
        }}
        webBookmarkDescriptionConfig={webBookmarkDescriptionConfig}
      />
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

function getMatchingText({
  node,
  matchedPiece,
}: RelevantNodeSuggestion): WebBookmarkDescriptionConfig {
  if (
    !NodeUtil.isWebBookmark(node) ||
    matchedPiece == null ||
    matchedPiece.matchValuableTokensCount < 2
  ) {
    // If card is not a bookmark, or there is no matching text or the longest
    // matching text is shorter than 32 characters, texts probably doesn't match
    // directly. In that case let's just show original description, best we can
    // do in such curcumstances.
    return { type: 'original-cutted' }
  }
  const { match, prefix, suffix } = matchedPiece
  return { type: 'match', prefix, match, suffix }
}

type SuggestedCardsProps = {
  nodes: RelevantNodeSuggestion[]
  onClose: () => void
  isLoading: boolean
}

const SuggestedCards = ({ nodes, onClose, isLoading }: SuggestedCardsProps) => {
  const analytics = React.useContext(ContentContext).analytics
  React.useEffect(() => {
    analytics?.capture('Show suggested associations', {
      'Event type': 'show',
      length: nodes.length,
    })
  }, [nodes, analytics])
  const suggestedCards = nodes.map((RelevantNodeSuggestion) => {
    return (
      <SuggestedCard
        key={RelevantNodeSuggestion.node.nid}
        node={RelevantNodeSuggestion.node}
        webBookmarkDescriptionConfig={getMatchingText(RelevantNodeSuggestion)}
      />
    )
  })
  return (
    <SuggestedCardsBox>
      <Header id="mazed-archaeologist-suggestions-floater-drag-handle">
        <CloseBtn onClick={onClose}>
          <HoverTooltip tooltip="Close" placement="bottom">
            <Minimize size="16px" />
          </HoverTooltip>
        </CloseBtn>
      </Header>
      <SuggestionsFloaterSuggestionsBox>
        {isLoading ? (
          <NoSuggestedCardsBox>
            <Spinner.Ring />
          </NoSuggestedCardsBox>
        ) : null}
        {suggestedCards.length > 0 ? suggestedCards : <NoSuggestedCardsBox />}
      </SuggestionsFloaterSuggestionsBox>
      <Footter id="mazed-archaeologist-suggestions-floater-drag-handle" />
    </SuggestedCardsBox>
  )
}

const DragIndicator = styled(DragHandle)`
  ${DraggableCursorStyles}
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
  isRevealed ? { x: -300, y: 72 } : { x: -32, y: 72 }

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
    React.useState<Position2D | null>(null) // getStartDragPosition(false))
  const [isRevealed, setRevealed] = React.useState<boolean>(defaultRevelaed)

  const analytics = React.useContext(ContentContext).analytics
  const saveRevealed = React.useCallback(
    async (revealed: boolean) => {
      try {
        await FromContent.sendMessage({
          type: 'REQUEST_CONTENT_AUGMENTATION_SETTINGS',
          settings: { isRevealed: revealed },
        })
      } catch (e) {
        productanalytics.warning(
          analytics,
          {
            failedTo: 'update user settings',
            location: 'floater',
            cause: errorise(e).message,
          },
          { andLog: true }
        )
      }
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
    [analytics]
  )
  useAsyncEffect(async () => {
    let settings: ContentAugmentationSettings | null = null
    try {
      const response = await FromContent.sendMessage({
        type: 'REQUEST_CONTENT_AUGMENTATION_SETTINGS',
      })
      settings = response.state
    } catch (e) {
      productanalytics.warning(
        analytics,
        {
          failedTo: 'get user settings',
          location: 'floater',
          cause: errorise(e).message,
        },
        { andLog: true }
      )
    }
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
    FromContent.sendMessage({
      type: 'REQUEST_CONTENT_AUGMENTATION_SETTINGS',
      settings: { positionY },
    }).catch((e) => {
      productanalytics.warning(
        analytics,
        {
          failedTo: 'update user settings',
          location: 'floater',
          cause: errorise(e).message,
        },
        { andLog: true }
      )
    })
    analytics?.capture('Drag SuggestionsFloater', {
      'Event type': 'drag',
      positionY,
      isRevealed,
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
                onClose={() => saveRevealed(false)}
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
