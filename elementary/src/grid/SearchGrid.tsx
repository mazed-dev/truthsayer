/** @jsxImportSource @emotion/react */

import React, { useMemo, useEffect, useRef, useState } from 'react'

import styled from '@emotion/styled'

import { css } from '@emotion/react'
import { useHistory } from 'react-router-dom'

import { Spinner } from '../spinner/mod'
import { SmallCard } from '../SmallCard'
import { ShrinkCard } from '../ShrinkCard'
import { NodeTimeBadge } from '../NodeTimeBadge'

import type { TNode, INodeIterator, StorageApi } from 'smuggler-api'

import { log, isAbortError, errorise } from 'armoury'

import { DynamicGrid } from './DynamicGrid'
import { NodeCardReadOnly } from '../NodeCardReadOnly'
import { Beagle } from './search/search'
import { styleMobileTouchOnly } from '../util/xstyle'

const BoxPortable = styled.div`
  overflow-y: scroll;
  -webkit-overflow-scrolling: touch;

  /* height: calc(50vh - 156px); */
  height: 80vh;
`

export const GridCard = ({
  onClick,
  className,
  children,
}: React.PropsWithChildren<{
  onClick: () => void
  className?: string
}>) => {
  return (
    <SmallCard
      onClick={onClick}
      className={className}
      css={css`
        ${styleMobileTouchOnly(css`
          width: 100%;
        `)}
      `}
    >
      {children}
    </SmallCard>
  )
}

const Mutex = require('async-mutex').Mutex

type SearchGridState = {
  nodes: TNode[]
  iter: INodeIterator
}
export const SearchGrid = ({
  q,
  children,
  onCardClick,
  portable,
  defaultSearch,
  className,
  storage,
}: React.PropsWithChildren<{
  q: string | null
  onCardClick?: (arg0: TNode) => void
  portable?: boolean
  defaultSearch?: boolean
  className?: string
  storage: StorageApi
}>) => {
  const history = useHistory()
  const ref = useRef<HTMLDivElement>(null)
  const beagle = useMemo(() => Beagle.fromString(q || undefined), [q])
  const [state, setState] = useState<SearchGridState | null>(null)
  const [fetching, setFetching] = useState<boolean>(false)
  const isScrolledToBottom = () => {
    let height: number = 0
    let scrollTop: number = 0
    let offsetHeight: number = 0
    if (portable) {
      height = ref.current?.offsetHeight || 0
      scrollTop = ref.current?.scrollTop || 0
      offsetHeight = ref.current?.scrollHeight || 0
      return height + scrollTop + 600 > offsetHeight
    }
    height = window.innerHeight
    scrollTop = document.documentElement.scrollTop
    offsetHeight = document.documentElement.offsetHeight
    return height + scrollTop + 300 >= offsetHeight
  }
  const mutex = useRef(new Mutex())
  const fetchNextBatch = React.useCallback(async () => {
    mutex.current.runExclusive(async () => {
      // Continue fetching until visual space is filled with cards to the bottom and beyond.
      // Thus if use scrolled to the bottom this loop would start fetching again adding more cards.
      if (!isScrolledToBottom()) {
        // Don't run more than 1 instance of fetcher
        return
      }
      setFetching(true)
      let iter: INodeIterator
      let nodes: TNode[]
      if (state == null) {
        iter = await storage.node.iterate()
        nodes = []
      } else {
        iter = state.iter
        nodes = state.nodes
      }
      try {
        // FIXME(Alexnader): With this batch size we predict N of cards to fill
        // the entire screen. As you can see this is a dirty hack, feel free to
        // replace it when you get there next time.
        const batchSize =
          (window.innerWidth * window.innerHeight * 2) / (240 * 240)
        let counter = 0
        while (counter < batchSize) {
          const node = await iter.next()
          if (node == null) {
            iter.abort()
            break
          }
          if (beagle.searchNode(node) != null) {
            ++counter
            nodes.push(node)
          }
        }
        setState({ iter, nodes })
        setFetching(false)
      } catch (err) {
        setFetching(false)
        const error = errorise(err)
        if (!isAbortError(error)) {
          log.exception(error)
        }
      }
    })
  }, [beagle, state])
  useEffect(() => {
    if (!portable) {
      window.addEventListener('scroll', fetchNextBatch, {
        passive: true,
      })
      return () => {
        window.removeEventListener('scroll', fetchNextBatch)
      }
    }
    return () => {}
  }, [fetchNextBatch])
  useEffect(() => {
    fetchNextBatch()
    return () => {
      // Clean up on changed search parameters
      setState(null)
    }
  }, [beagle])
  if (q == null && !defaultSearch) {
    return null
  }
  const fetchingLoader = fetching ? (
    <div
      css={css`
        margin: 2rem;
      `}
    >
      <Spinner.Wheel />
    </div>
  ) : null
  const cards = state?.nodes.map((node) => {
    const onClick = () => {
      if (onCardClick) {
        onCardClick(node)
      } else {
        history.push({
          pathname: `/n/${node.nid}`,
        })
      }
    }
    return (
      <GridCard onClick={onClick} key={node.nid}>
        <ShrinkCard>
          <NodeCardReadOnly
            node={node}
            strippedRefs
            strippedActions
            storage={storage}
          />
        </ShrinkCard>
        <NodeTimeBadge
          created_at={node.created_at}
          updated_at={node.updated_at}
        />
      </GridCard>
    )
  })
  const grid = (
    <>
      <DynamicGrid
        css={css`
          justify-content: center;
          ${styleMobileTouchOnly(css`
            grid-template-columns: 50% 50%;
          `)}
        `}
      >
        <>{children}</>
        <>{cards}</>
      </DynamicGrid>
      {fetchingLoader}
    </>
  )
  if (portable) {
    return (
      <BoxPortable className={className} onScroll={fetchNextBatch} ref={ref}>
        {grid}
      </BoxPortable>
    )
  } else {
    return (
      <div className={className} onScroll={fetchNextBatch} ref={ref}>
        {grid}
      </div>
    )
  }
}
