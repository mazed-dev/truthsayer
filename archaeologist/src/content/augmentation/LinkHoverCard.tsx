import React from 'react'
import lodash from 'lodash'
import styled from '@emotion/styled'
import moment from 'moment'
import { Settings } from '@emotion-icons/material'

import { errorise, log, productanalytics } from 'armoury'
import type { TNode, NodeTextData } from 'smuggler-api'
import { NodeUtil } from 'smuggler-api'
import {
  NodeCard,
  NodeTimeBadge,
  ScopedTimedAction,
  truthsayer,
} from 'elementary'

import { ContentContext } from '../context'
import { FromContent } from '../../message/types'

import { AugmentationElement, kAugmentationElementId } from './Mount'

const BookmarkCardToolbarSavedStatus = styled.div`
  width: 30px;
`

const SettingsBtn = styled.a`
  padding: 4px;
  margin: 2px;
  cursor: pointer;

  display: flex;
  text-decoration: none;
  vertical-align: middle;
  align-items: baseline;
  justify-content: center;

  background: unset;
  background-color: #ffffff;
  color: #000000;

  border-radius: 14px;
  border-style: solid;
  border-width: 0;

  opacity: 0.5;
  &:hover {
    opacity: 1;
    background-color: #d0d1d2;
  }
`
const BookmarkCardToolbarSettings = () => {
  return (
    <SettingsBtn
      href={truthsayer.url.getSettings().toString()}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Settings size="14" />
    </SettingsBtn>
  )
}
const BookmarkCardToolbarBox = styled.div`
  display: flex;
  flex-wrap: nowrap;
  flex-direction: row;
  justify-content: space-between;
`
const NodeTimeBadgeStyled = styled(NodeTimeBadge)`
  padding: 4px 10px 4px 0;
`
const BookmarkCardToolbar = ({ children }: React.PropsWithChildren<{}>) => {
  return <BookmarkCardToolbarBox>{children}</BookmarkCardToolbarBox>
}

const BookmarkCardBox = styled.div`
  background: #ffffff;
  color: #484848;
  font-size: 12px;
  font-family: 'Roboto', Helvetica, Arial, sans-serif;
  letter-spacing: -0.01em;
  line-height: 142%;
  text-align: left;

  overflow-wrap: break-word;
  word-break: normal;

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
        saveNode={async (text: NodeTextData) => {
          await FromContent.sendMessage({
            type: 'REQUEST_UPDATE_NODE',
            args: { nid: node.nid, text },
          })
          return { ack: true }
        }}
      />
      <BookmarkCardToolbar>
        <BookmarkCardToolbarSavedStatus />
        <BookmarkCardToolbarSettings />
        <NodeTimeBadgeStyled
          created_at={node.created_at}
          updated_at={node.updated_at}
        />
      </BookmarkCardToolbar>
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
  const cardWidth = 328
  const x: number = Math.min(
    rect.left /* + rect.width */,
    window.innerWidth - cardWidth - 12
  )
  let y: number = rect.top + rect.height + 16
  if (y > window.innerHeight - 180) {
    y = rect.top - 180
  }
  return { x, y }
}

type State = {
  position: Position
  node: TNode
}

export function LinkHoverCard() {
  const ctx = React.useContext(ContentContext)
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
          // If you still don't understand how it works, just talk to me please.
          return
        }
        let refElement: HTMLLinkElement | undefined = undefined
        if (element.tagName === 'A') {
          refElement = element as HTMLLinkElement
        }
        if (element.parentElement?.tagName === 'A') {
          refElement = element.parentElement as HTMLLinkElement
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
          log.debug('Position', position)
          setState({ node, position })
          ctx.analytics?.capture('LinkHoverCard: show card', {
            nid: node.nid,
          })
        } else {
          setState(null)
        }
      }, 1013),
    [ctx.analytics]
  )
  React.useEffect(() => {
    const callback = (event: MouseEvent) => {
      if (event.target) {
        const element = event.target as HTMLElement
        requestSavedPageNode(element)?.catch((err) => {
          productanalytics.warning(
            ctx.analytics ?? null,
            {
              failedTo: 'show LinkHoverCard',
              location: 'floater',
              cause: errorise(err).message,
            },
            { andLog: true }
          )
        })
      }
    }
    const opts: AddEventListenerOptions = { passive: true, capture: true }
    window.addEventListener('mouseover', callback, opts)
    return () => {
      window.removeEventListener('mouseover', callback, opts)
    }
  }, [requestSavedPageNode, ctx.analytics])
  if (state == null) {
    return null
  }
  return (
    <AugmentationElement disableInFullscreenMode>
      <Box position={state.position}>
        <BookmarkCard node={state.node} />
      </Box>
      <ScopedTimedAction
        action={() =>
          ctx.analytics?.capture(
            'LinkHoverCard: card kept open longer than threshold',
            {
              thresholdSec: 3,
              nid: state.node.nid,
            }
          )
        }
        after={moment.duration(3, 'seconds')}
      />
    </AugmentationElement>
  )
}
