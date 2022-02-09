/** @jsxImportSource @emotion/react */

import React, { useRef, useEffect, useState, useContext } from 'react'

import { css } from '@emotion/react'
import { useAsyncEffect } from 'use-async-effect'
import { useHistory } from 'react-router-dom'

import { jcss, Spinner } from 'elementary'
import { smuggler, TNodeSliceIterator, TNode } from 'smuggler-api'

import styles from './SearchGrid.module.css'
import { DynamicGrid } from './DynamicGrid'
import { MzdGlobalContext } from '../lib/global'
import { Optional } from '../util/types'
import { SCard } from '../card/ShrinkCard'
import { SmallCard } from '../card/SmallCard'
import { SmallCardRender } from '../doc/ReadOnlyRender'
import { TimeBadge } from '../card/AuthorBadge'
import { isAbortError } from '../util/exception'
import { isSmartCase } from '../util/str'
import { searchNodeFor } from './search/search'
import { styleMobileTouchOnly } from '../util/xstyle'

import * as log from '../util/log'

export const GridCard = ({
  onClick,
  className,
  children,
}: React.PropsWithChildren<{
  onClick: () => void
  className?: string
}>) => {
  className = jcss(styles.grid_cell, className)
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
}: React.PropsWithChildren<{
  q: string | null
  onCardClick?: (arg0: TNode) => void
  portable?: boolean
  defaultSearch?: boolean
}>) => {
  const history = useHistory()
  const ref = useRef<HTMLDivElement>(null)
  // const fetchAbortController = new AbortController()
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

  const fetchData = async () => {
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
  }

  useAsyncEffect(async () => {
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
  // We have to start fetching only on a change to the search parameters.
  useAsyncEffect(async () => {
    await fetchData()
    return () => {
      fetchAbortController?.abort()
    }
  }, [q])
  const fetchingLoader =
    fetching || account == null ? (
      <div className={styles.search_grid_loader}>
        <Spinner.Wheel />
      </div>
    ) : null
  const used = new Set<string>()
  const cards: JSX.Element[] = nodes
    .filter((node) => {
      const { nid } = node
      if (used.has(nid)) {
        // Node ids collision on search grid, too bad, should not happend
        return false
      }
      used.add(nid)
      return true
    })
    .map((node) => {
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
          <SCard>
            <SmallCardRender node={node} />
          </SCard>
          <TimeBadge
            created_at={node.created_at}
            updated_at={node.updated_at}
          />
        </GridCard>
      )
    })
  used.clear() // A clean up, we don't need the interminent value further
  const gridStyle = portable ? styles.search_grid_portable : undefined
  return (
    <div
      className={jcss(gridStyle, styles.search_grid)}
      onScroll={handleScroll}
      ref={ref}
    >
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
    </div>
  )
}
