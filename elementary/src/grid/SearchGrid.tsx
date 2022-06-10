/** @jsxImportSource @emotion/react */

import React, { useEffect, useRef, useState } from 'react'

import { default as styled } from '@emotion/styled'

import { css } from '@emotion/react'
import { useAsyncEffect } from 'use-async-effect'
import { useHistory } from 'react-router-dom'

import { Spinner } from '../spinner/mod.js'
import { SmallCard } from '../SmallCard.js'
import { ShrinkCard } from '../ShrinkCard.js'
import { NodeTimeBadge } from '../NodeTimeBadge.js'

import { smuggler, TNodeSliceIterator, TNode } from 'smuggler-api'

import { log, isAbortError, errorise } from 'armoury'

import { DynamicGrid } from './DynamicGrid.js'
import { NodeCardReadOnly } from '../NodeCardReadOnly.js'
import { Beagle } from './search/search.js'
import { styleMobileTouchOnly } from '../util/xstyle.js'

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
  if (q == null && !defaultSearch) {
    return null
  }
  return (
    <SearchGridScroll
      beagle={q == null ? null : Beagle.fromString(q)}
      iter={smuggler.node.slice({})}
      onCardClick={onCardClick}
      portable={portable}
      className={className}
    >
      {children}
    </SearchGridScroll>
  )
}

const SearchGridScroll = ({
  beagle,
  iter,
  children,
  onCardClick,
  portable,
  className,
}: React.PropsWithChildren<{
  beagle: Beagle | null
  iter: TNodeSliceIterator
  onCardClick?: (arg0: TNode) => void
  portable?: boolean
  className?: string
}>) => {
  const history = useHistory()
  const ref = useRef<HTMLDivElement>(null)
  const [nodes, setNodes] = useState<TNode[]>([])
  const [fetching, setFetching] = useState<boolean>(false)
  const [nextBatchTrigger, setNextBatchTrigger] = useState<number>(0)

  const handleScroll = () => {
    if (!fetching && isScrolledToBottom()) {
      setNextBatchTrigger((prev) => prev + 1)
    }
  }
  useEffect(() => {
    if (!portable) {
      window.addEventListener('scroll', handleScroll, { passive: true })
      return () => {
        window.removeEventListener('scroll', handleScroll)
      }
    }
    return () => {}
  }, [])
  useEffect(() => {
    // To clean up grid on changed search conditions
    setNodes([])
  }, [beagle, iter])

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

  useAsyncEffect(
    async (isMounted: () => boolean) => {
      // Continue fetching until visual space is filled with cards to the bottom and beyond.
      // Thus if use scrolled to the bottom this loop would start fetching again adding more cards.
      setFetching(true)
      try {
        while (isScrolledToBottom()) {
          if (!isMounted()) {
            iter.abort()
            return
          }
          const node = await iter.next()
          if (!isMounted() || node == null) {
            iter.abort()
            break
          }
          if (beagle == null || beagle.searchNode(node) != null) {
            setNodes((prev) => prev.concat(node))
          }
        }
      } catch (err) {
        const error = errorise(err)
        if (!isAbortError(error)) {
          log.exception(error)
        }
      }
      setFetching(false)
    },
    [nextBatchTrigger, beagle, iter]
  )
  const fetchingLoader = fetching ? (
    <div
      css={css`
        margin: 2rem;
      `}
    >
      <Spinner.Wheel />
    </div>
  ) : null
  const cards: JSX.Element[] = nodes.map((node) => {
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
          <NodeCardReadOnly node={node} strippedRefs strippedActions />
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
