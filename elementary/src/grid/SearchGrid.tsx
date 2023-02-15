/** @jsxImportSource @emotion/react */

import React from 'react'

import styled from '@emotion/styled'

import { css } from '@emotion/react'
import type { RouteComponentProps } from 'react-router-dom'

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

type SearchGridProps = React.PropsWithChildren<{
  q: string | null
  onCardClick?: (arg0: TNode) => void
  portable?: boolean
  defaultSearch?: boolean
  className?: string
  storage: StorageApi
}>
type SearchGridState = {
  iter?: INodeIterator
  beagle?: Beagle
  nodes: TNode[]
  fetching: boolean
}

export class SearchGrid extends React.Component<
  SearchGridProps,
  SearchGridState
> {
  private mutex = new Mutex()
  private boxRef: React.RefObject<HTMLDivElement>
  constructor(props: SearchGridProps) {
    super(props)
    this.state = {
      nodes: [],
      fetching: false,
    }
    this.boxRef = React.createRef<HTMLDivElement>()
  }
  fetchNextBatch = async () => {
    this.mutex.runExclusive(async () => {
      log.debug('fetchNextBatch.mutex.current.runExclusive')
      const { iter, nodes, beagle } = this.state
      // Continue fetching until visual space is filled with cards to the bottom and beyond.
      // Thus if use scrolled to the bottom this loop would start fetching again adding more cards.
      if (!this.isScrolledToBottom() || iter == null || beagle == null) {
        // Don't run more than 1 instance of fetcher
        return
      }
      log.debug('fetchNextBatch.mutex.current.runExclusive 2')
      // setFetching(true)
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
        log.debug('fetchNextBatch.mutex.current.runExclusive set state')
        this.setState({
          nodes,
          iter,
        })
        // setFetching(false)
      } catch (err) {
        // setFetching(false)
        const error = errorise(err)
        if (!isAbortError(error)) {
          log.exception(error)
        }
      }
    })
  }
  componentDidMount() {
    this.props.storage.node.iterate().then((iter: INodeIterator) => {
      this.setState({
        beagle: Beagle.fromString(this.props.q || undefined),
        iter,
      })
      this.fetchNextBatch()
    })
    if (!this.props.portable) {
      window.addEventListener('scroll', this.fetchNextBatch, {
        passive: true,
      })
    }
  }
  componentWillUnmount() {
    if (!this.props.portable) {
      window.removeEventListener('scroll', this.fetchNextBatch)
    }
  }
  componentDidUpdate(prevProps: SearchGridProps) {
    if (this.props.q !== prevProps.q) {
      // this.setState({
      //   beagle: undefined,
      //   iter: undefined,
      // })
      this.props.storage.node.iterate().then((iter: INodeIterator) =>
        this.setState({
          beagle: Beagle.fromString(this.props.q || undefined),
          iter,
        })
      )
    }
  }
  isScrolledToBottom = () => {
    let height: number = 0
    let scrollTop: number = 0
    let offsetHeight: number = 0
    if (this.props.portable) {
      height = this.boxRef.current?.offsetHeight || 0
      scrollTop = this.boxRef.current?.scrollTop || 0
      offsetHeight = this.boxRef.current?.scrollHeight || 0
      return height + scrollTop + 600 > offsetHeight
    }
    height = window.innerHeight
    scrollTop = document.documentElement.scrollTop
    offsetHeight = document.documentElement.offsetHeight
    return height + scrollTop + 300 >= offsetHeight
  }
  render() {
    const {
      q,
      defaultSearch,
      storage,
      onCardClick,
      portable,
      className,
      children,
    } = this.props
    const { nodes } = this.state
    const fetching = false
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
    const cards = nodes.map((node) => {
      // const onClick = () => {
      //   if (onCardClick) {
      //     onCardClick(node)
      //   } else {
      //     history.push({
      //       pathname: `/n/${node.nid}`,
      //     })
      //   }
      // }
      return (
        <GridCard onClick={() => {}} key={node.nid}>
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
        <BoxPortable
          className={className}
          onScroll={this.fetchNextBatch}
          ref={this.boxRef}
        >
          {grid}
        </BoxPortable>
      )
    } else {
      return (
        <div
          className={className}
          onScroll={this.fetchNextBatch}
          ref={this.boxRef}
        >
          {grid}
        </div>
      )
    }
  }
}
