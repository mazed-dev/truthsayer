import React from 'react'
import lodash from 'lodash'
import styled from '@emotion/styled'

import { log } from 'armoury'
import type { TNode, NodeTextData } from 'smuggler-api'
import { NodeUtil } from 'smuggler-api'
import { NodeCard } from 'elementary'

import { ContentContext } from '../context'
import { FromContent } from '../../message/types'

import { AugmentationElement, kAugmentationElementId } from './Mount'

const BookmarkCardBox = styled.div`
  background: #ffffff;
  color: #484848;
  font-size: 14px;
  font-family: 'Roboto', Helvetica, Arial, sans-serif;
  letter-spacing: -0.01em;
  line-height: 142%;
  text-align: left;

  overflow-wrap: break-word;
  word-break: normal;

  padding-bottom: 12px;
  border-radius: 5px;
  box-shadow: 0 2px 8px 2px rgba(60, 64, 68, 0.24);
  user-select: auto;
`

export const BookmarkCard = ({
  node,
  className,
}: {
  node: TNode
  className?: string
}) => {
  const ctx = React.useContext(ContentContext)
  return (
    <BookmarkCardBox className={className}>
      <NodeCard
        ctx={ctx}
        node={node}
        strippedFormatToolbar={true}
        saveNode={async (_text: NodeTextData) => {
          return { ack: true }
        }}
      />
    </BookmarkCardBox>
  )
}

type Position = { x: number; y: number }

const Box = styled.div<{ position: Position }>`
  position: absolute;
  left: ${(props) => props.position.x}px;
  top: ${(props) => props.position.y}px;
`
function calculateCardPosition(rect: DOMRect): Position {
  return {
    x: rect.left /* + rect.width */,
    y: rect.top + rect.height + 8,
  }
}

type State = {
  position: Position
  node: TNode
}

export function LinkHoverCard() {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const [state, setState] = React.useState<State | null>(null)
  const requestSavedPageNode = React.useMemo(
    // Using `useMemo` instead of `useCallback` to avoid eslint complains
    // https://kyleshevlin.com/debounce-and-throttle-callbacks-with-react-hooks
    () =>
      lodash.debounce(async (element: HTMLElement) => {
        if (element.id === kAugmentationElementId) {
          // To prevent shutting down hover preview when user moves it's cursor
          // to the bookmark card.
          //
          // Note(Alexander): We can't see through the barier of a shadow
          // element, so we can't detect that user is hover over Foreword
          // augmentation using traditional methods. But with shadow element, we
          // receive only top shadow element, so we can just check it's id.
          //
          // If you still don't understand how it works, just come and talk to
          // me please. Cheers, Alexander.
          return
        }
        let refElement: HTMLLinkElement | undefined = undefined
        if (element.tagName === 'A') {
          refElement = element as HTMLLinkElement
        }
        if (element.parentElement?.tagName === 'A') {
          refElement = element.parentElement as HTMLLinkElement
        }
        if (refElement != null) {
          log.debug('Mouse hover element', refElement.href)
        }
        if (!refElement?.href) {
          setState(null)
          return
        }
        const resp = await FromContent.sendMessage({
          type: 'REQUEST_PAGE_NODE_BY_URL',
          url: refElement.href,
        })
        const bookmark = resp.bookmark
        if (bookmark != null) {
          const node = NodeUtil.fromJson(bookmark)
          const position = calculateCardPosition(
            element.getBoundingClientRect()
          )
          log.debug('Positino', position)
          setState({ node, position })
        }
      }, 701),
    [rootRef]
  )
  React.useEffect(() => {
    const callback = (event: MouseEvent) => {
      if (event.target) {
        const element = event.target as HTMLElement
        requestSavedPageNode(element)
      }
    }
    const opts: AddEventListenerOptions = { passive: true, capture: true }
    window.addEventListener('mouseover', callback, opts)
    return () => {
      window.removeEventListener('mouseover', callback, opts)
    }
  }, [requestSavedPageNode])
  if (state == null) {
    return null
  }
  return (
    <AugmentationElement disableInFullscreenMode>
      <Box position={state.position} ref={rootRef} >
        <BookmarkCard
          node={state.node}
        />
      </Box>
    </AugmentationElement>
  )
}
