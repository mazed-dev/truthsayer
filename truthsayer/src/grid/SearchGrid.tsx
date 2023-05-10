/** @jsxImportSource @emotion/react */

import React from 'react'

import styled from '@emotion/styled'

import { css } from '@emotion/react'
import type { RouteComponentProps } from 'react-router-dom'
import { useHistory } from 'react-router-dom'

import type { TNode, INodeIterator } from 'smuggler-api'

import { log, isAbortError, errorise } from 'armoury'
import MzdGlobalContext, { MzdGlobalContextProps } from '../lib/global'

import {
  DynamicGrid,
  NodeCardReadOnly,
  Beagle,
  styleMobileTouchOnly,
  SmallCard,
  ShrinkCard,
  NodeTimeBadge,
} from 'elementary'

const BoxPortable = styled.div`
  overflow-y: scroll;
  -webkit-overflow-scrolling: touch;

  /* height: calc(50vh - 156px); */
  height: 80vh;
`

export const GridCard = ({
  className,
  children,
  onClick,
}: React.PropsWithChildren<{
  to?: string
  className?: string
  onClick?: React.MouseEventHandler
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
}>
type SearchGridWithHistProps = SearchGridProps & {
  history: RouteComponentProps['history']
  ctx: MzdGlobalContextProps
}
type SearchGridState = {
  iter?: INodeIterator
  beagle?: Beagle
  nodes: TNode[]
}

class SearchGridWithHist extends React.Component<
  SearchGridWithHistProps,
  SearchGridState
> {
  private mutex = new Mutex()
  private boxRef: React.RefObject<HTMLDivElement>
  constructor(props: SearchGridWithHistProps) {
    super(props)
    this.state = {
      nodes: [],
    }
    this.boxRef = React.createRef<HTMLDivElement>()
  }
  fetchNextBatch = async () => {
    this.mutex.runExclusive(async () => {
      const { iter, nodes, beagle } = this.state
      // Continue fetching until visual space is filled with cards to the bottom and beyond.
      // Thus if use scrolled to the bottom this loop would start fetching again adding more cards.
      if (!this.isScrolledToBottom() || iter == null || beagle == null) {
        // Don't run more than 1 instance of fetcher
        return
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
        this.setState({
          nodes,
          iter,
        })
      } catch (err) {
        const error = errorise(err)
        if (!isAbortError(error)) {
          log.exception(error)
        }
      }
    })
  }
  componentDidMount() {
    this.resetSearchState()
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
  componentDidUpdate(prevProps: SearchGridWithHistProps) {
    if (this.props.q !== prevProps.q) {
      this.resetSearchState()
    }
  }
  async resetSearchState(): Promise<void> {
    const iter = await this.props.ctx.storage.node.iterate()
    // Reset state and restart fetching process when state is updated
    this.setState(
      {
        nodes: [],
        beagle: Beagle.fromString(this.props.q || undefined),
        iter,
      },
      () => this.fetchNextBatch()
    )
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
      ctx,
      q,
      defaultSearch,
      onCardClick,
      portable,
      className,
      children,
      history,
    } = this.props
    const { nodes } = this.state
    if (q == null && !defaultSearch) {
      return null
    }
    const cards = nodes.map((node) => {
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
              ctx={ctx}
              node={node}
              strippedRefs
              strippedActions
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

export const SearchGrid = (props: SearchGridProps) => {
  const history = useHistory()
  const ctx = React.useContext(MzdGlobalContext)
  return <SearchGridWithHist history={history} ctx={ctx} {...props} />
}
