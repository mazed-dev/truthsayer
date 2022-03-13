/** @jsxImportSource @emotion/react */

import React, { useRef, useState, useContext } from 'react'

import styled from '@emotion/styled'

import { css } from '@emotion/react'
import { useAsyncEffect } from 'use-async-effect'
import { useHistory } from 'react-router-dom'

import { Spinner, SmallCard, ShrinkCard, NodeTimeBadge } from 'elementary'

import { smuggler, TNodeSliceIterator, TNode } from 'smuggler-api'

import { log, isAbortError, Optional } from 'armoury'

import { DynamicGrid } from './DynamicGrid'
import { MzdGlobalContext } from '../lib/global'
import { NodeCard } from '../card/NodeCard'
import { isSmartCase } from '../util/str'
import { searchNodeFor } from './search/search'
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

function makePattern(q: string | null): Optional<RegExp> {
  if (q == null || q.length < 2) {
    return null
  }
  // TODO(akindyakov) Use multiline search here
  const flags = isSmartCase(q) ? '' : 'i'
  return new RegExp(q, flags)
}

export const SearchGrid = ({
  q,
  children,
  onCardClick,
  portable,
  defaultSearch,
  className,
}: React.PropsWithChildren<{
  q: string | null
  onCardClick?: (arg0: TNode) => void
  portable?: boolean
  defaultSearch?: boolean
  className?: string
}>) => {
  const history = useHistory()
  const ref = useRef<HTMLDivElement>(null)
  const pattern = makePattern(q)
  const ctx = useContext(MzdGlobalContext)
  const account = ctx.account
  const [nodes, setNodes] = useState<TNode[]>([])
  const [fetching, setFetching] = useState<boolean>(false)
  const [nextBatchTrigger, setNextBatchTrigger] = useState<number>(0)
  const [iter, setIter] = useState<TNodeSliceIterator | null>()
  const [fetchAbortController, setFetchAbortController] =
    useState<AbortController | null>(null)

  const isScrolledToBottom = () => {
    let height: number = 0
    let scrollTop: number = 0
    let offsetHeight: number = 0
    if (portable) {
      height = ref.current?.offsetHeight || 0
      scrollTop = ref.current?.scrollTop || 0
      offsetHeight = ref.current?.scrollHeight || 0
      return height + scrollTop + 300 > offsetHeight
    }
    height = window.innerHeight
    scrollTop = document.documentElement.scrollTop
    offsetHeight = document.documentElement.offsetHeight
    return height + scrollTop + 300 >= offsetHeight
  }

  useAsyncEffect(async () => {
    // Continue fetching until visual space is filled with cards to the bottom and beyond.
    // Thus if use scrolled to the bottom this loop would start fetching again adding more cards.
    setFetching(true)
    try {
      while (isScrolledToBottom()) {
        const node = await iter?.next()
        if (!node) {
          break
        }
        if (!pattern || searchNodeFor(node, pattern)) {
          setNodes((prev) => [...prev, node])
        }
      }
    } catch (err) {
      if (!isAbortError(err)) {
        log.exception(err)
      }
    }
    setFetching(false)
    return () => {
      fetchAbortController?.abort()
    }
  }, [nextBatchTrigger])

  const handleScroll = () => {
    if (!fetching && isScrolledToBottom()) {
      setNextBatchTrigger((prev) => prev + 1)
    }
  }

  useAsyncEffect(async () => {
    if (!portable) {
      window.addEventListener('scroll', handleScroll, { passive: true })
    }
    return () => {
      if (!portable) {
        window.removeEventListener('scroll', handleScroll)
      }
    }
  }, [])
  useAsyncEffect(async () => {
    // This is an effect to spin up a new search only from search text "q", this
    // is why thie effect is called only when "q" props is changed.
    //
    // It creates a new iterator from search string and assign it to state:
    // - iter - iterator itself to do fetching step by step;
    // - fetchAbortController - to be able to cancel an iteration;
    // - nextBatchTrigger - to trigger first iteration of fetching with another
    // react effect declared above.
    setNodes([])
    if (pattern == null && !defaultSearch) {
      setIter(null)
      return
    }
    if (fetchAbortController != null) {
      fetchAbortController.abort()
    }
    const newAbortController = new AbortController()
    setFetchAbortController(newAbortController)
    const iter_ = smuggler.node.slice({
      signal: newAbortController.signal,
    })
    setIter(iter_)
    setNextBatchTrigger((prev) => prev + 1)
  }, [q])
  const fetchingLoader =
    fetching || account == null ? (
      <div
        css={css`
          margin: 2rem;
        `}
      >
        <Spinner.Wheel />
      </div>
    ) : null
  const cards: JSX.Element[] = nodes.map((node) => {
    const { nid } = node
    const onClick = () => {
      if (onCardClick) {
        onCardClick(node)
      } else {
        history.push({
          pathname: `/n/${nid}`,
        })
      }
    }
    return (
      <GridCard onClick={onClick} key={nid}>
        <ShrinkCard>
          <NodeCard node={node} />
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
      <BoxPortable className={className} onScroll={handleScroll} ref={ref}>
        {grid}
      </BoxPortable>
    )
  } else {
    return (
      <div className={className} onScroll={handleScroll} ref={ref}>
        {grid}
      </div>
    )
  }
}
