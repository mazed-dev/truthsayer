/** @jsxImportSource @emotion/react */

import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'

import { Row, Col } from 'react-bootstrap'

import { NodeCard } from 'elementary'
import { FullCardFootbar } from './FullCardFootbar'

import { NodeCardReadOnlyFetching } from 'elementary'

import { SmallCardFootbar } from './SmallCardFootbar'
import { ChainActionBar } from './ChainActionBar'
import { DynamicGrid } from 'elementary'

import { MzdGlobalContext } from '../lib/global'
import { Optional, isAbortError, log, errorise } from 'armoury'
import { styleMobileTouchOnly } from 'elementary'

import { TNode, NodeTextData, TEdge, NodeUtil } from 'smuggler-api'

import { css } from '@emotion/react'
import {
  Spinner,
  WideCard,
  SmallCard,
  kSmallCardWidth,
  ShrinkCard,
} from 'elementary'

import lodash from 'lodash'

function RefNodeCard({
  nid,
  edge,
  switchStickiness,
  cutOffRef,
  className,
}: {
  nid: string
  edge: TEdge
  switchStickiness: any
  cutOffRef: any
  className?: string
}) {
  const navigate = useNavigate()
  const ctx = useContext(MzdGlobalContext)
  return (
    <SmallCard
      className={className}
      css={css`
        position: relative;
      `}
    >
      <ShrinkCard
        css={css`
          margin-bottom: 12px;
          cursor: pointer;
        `}
        onClick={() => navigate({ pathname: `/n/${nid}` })}
      >
        <NodeCardReadOnlyFetching
          ctx={ctx}
          nid={nid}
          strippedRefs={true}
          strippedActions={true}
        />
      </ShrinkCard>
      <div
        css={css`
          width: 100%;
          position: absolute;
          bottom: 0;
          right: 0;
          z-index: 900;
        `}
      >
        <SmallCardFootbar
          edge={edge}
          switchStickiness={switchStickiness}
          cutOffRef={cutOffRef}
        />
      </div>
    </SmallCard>
  )
}

function NodeRefs({
  side,
  nid,
  edges,
  switchStickiness,
  cutOffRef,
}: {
  side: 'left' | 'right'
  nid: string
  edges: TEdge[]
  switchStickiness: any
  cutOffRef: any
}) {
  const maxColumns = side === 'left' ? 1 : undefined
  const refs = edges.map((edge) => {
    const refCardNid = edge.from_nid === nid ? edge.to_nid : edge.from_nid
    return (
      <RefNodeCard
        nid={refCardNid}
        edge={edge}
        switchStickiness={switchStickiness}
        cutOffRef={cutOffRef}
        key={edge.eid}
        css={css`
          ${styleMobileTouchOnly(css`
            width: 100%;
          `)}
        `}
      />
    )
  })
  return (
    <DynamicGrid
      columns_n_max={maxColumns}
      columns_n_min={1}
      css={css`
        width: 100%;
        justify-content: ${side === 'left' ? 'end' : 'start'};
        ${styleMobileTouchOnly(css`
          grid-template-columns: 50% 50%;
        `)}
      `}
    >
      {refs}
    </DynamicGrid>
  )
}

type TriptychProps = {
  nid: string
}
type TriptychState = {
  node: Optional<TNode>
  edges_left: TEdge[]
  edges_right: TEdge[]
  edges_sticky: TEdge[]
}

export class Triptych extends React.Component<TriptychProps, TriptychState> {
  static contextType = MzdGlobalContext
  context!: React.ContextType<typeof MzdGlobalContext>

  fetchToEdgesAbortController: AbortController
  fetchFromEdgesAbortController: AbortController
  fetchNodeAbortController: AbortController
  createEdgeAbortController: AbortController
  createNodeAbortController: AbortController

  constructor(props: TriptychProps) {
    super(props)
    this.state = {
      node: null,
      edges_left: [],
      edges_right: [],
      edges_sticky: [],
    }
    this.fetchToEdgesAbortController = new AbortController()
    this.fetchFromEdgesAbortController = new AbortController()
    this.fetchNodeAbortController = new AbortController()
    this.createEdgeAbortController = new AbortController()
    this.createNodeAbortController = new AbortController()
  }

  componentDidMount() {
    Promise.all([this.fetchEdges(), this.fetchNode()]).catch((reason) =>
      log.error(`Failed to init tryptich: ${reason}`)
    )
  }

  componentWillUnmount() {
    this.fetchToEdgesAbortController.abort()
    this.fetchFromEdgesAbortController.abort()
    this.fetchNodeAbortController.abort()
  }

  componentDidUpdate(prevProps: TriptychProps) {
    // Don't forget to compare props!
    if (this.props.nid !== prevProps.nid) {
      Promise.all([this.fetchEdges(), this.fetchNode()]).catch((reason) =>
        log.error(`Failed to update tryptich: ${reason}`)
      )
    }
  }

  fetchEdges = async () => {
    this.setState({
      edges_left: [],
      edges_right: [],
      edges_sticky: [],
    })
    try {
      const { from_edges, to_edges } = await this.context.storage.edge.get(
        { nid: this.props.nid },
        this.fetchToEdgesAbortController.signal
      )
      this.setState({
        edges_left: from_edges,
        edges_right: to_edges,
        edges_sticky: from_edges
          .concat(to_edges)
          .filter((edge) => !edge.is_sticky),
      })
    } catch (e) {
      const err = errorise(e)
      if (!isAbortError(err)) {
        log.exception(err)
      }
    }
  }

  fetchNode = async () => {
    this.setState({ node: null })
    const nid = this.props.nid
    try {
      const node = await this.context.storage.node.get(
        {
          nid,
        },
        this.fetchNodeAbortController.signal
      )
      this.setState({ node })
    } catch (e) {
      const err = errorise(e)
      if (!isAbortError(err)) {
        log.exception(err)
      }
    }
  }

  saveNode = lodash.debounce(
    async (text: NodeTextData) => {
      // TODO(akindyakov): move conversion from raw slate to doc to here
      // TODO(akindyakov): collect stats here
      const nid = this.props.nid
      return await this.context.storage.node.update(
        {
          nid,
          text,
        },
        this.fetchNodeAbortController.signal
      )
    },
    757,
    {
      leading: true,
      maxWait: 1867,
      trailing: true,
    }
  )

  cutOffRef = (eid: string) => {
    this.setState((state) => {
      const rm = (edge: TEdge) => edge.eid !== eid
      return {
        edges_left: state.edges_left.filter(rm),
        edges_right: state.edges_right.filter(rm),
        edges_sticky: state.edges_sticky.filter(rm),
      }
    })
  }

  addRef = async ({ from, to }: { from: string; to: string }) => {
    const { edges_right, edges_left } = this.state
    const { nid } = this.props
    const edge = await this.context.storage.edge.create(
      {
        from,
        to,
      },
      this.createEdgeAbortController.signal
    )
    if (to === nid) {
      this.setState({
        edges_left: edges_left.concat([edge]),
      })
    } else {
      this.setState({
        edges_right: edges_right.concat([edge]),
      })
    }
  }

  switchStickiness = (edge: TEdge, on = false) => {
    if (on) {
      edge.is_sticky = true
      this.setState((state) => {
        const new_sticky_edges = state.edges_sticky.concat([edge])
        return {
          edges_sticky: new_sticky_edges,
        }
      })
    } else {
      const rm = (e: TEdge) => edge.eid !== e.eid
      this.setState((state) => {
        const filtered = state.edges_sticky.filter(rm)
        return {
          edges_sticky: filtered,
        }
      })
    }
  }

  render() {
    const { node, edges_right, edges_left } = this.state
    const nodeCard =
      node !== null ? (
        <NodeCard ctx={this.context} node={node} saveNode={this.saveNode} />
      ) : (
        <Spinner.Wheel />
      )
    const nodeIsPrivate =
      this.state.node && this.context.account
        ? NodeUtil.isOwnedBy(this.state.node, this.context.account)
        : true
    const colBaseCss = css`
      margin: 0;
      padding: 0;
      ${styleMobileTouchOnly(css`
        width: 100vw;
        height: 100vh;
        max-width: 100%;
        display: inline-block;
        flex: none;
        scroll-snap-align: center;
        scroll-snap-stop: always;
      `)}
    `
    return (
      <Row
        css={css`
          margin: 1px 10px 0 10px;
          padding: 0;
          width: 100%;
          display: flex;
          flex: none;
          flex-flow: row nowrap;
          ${styleMobileTouchOnly(css`
            height: 100vh;
            overflow: auto;
            scroll-snap-type: x mandatory;
          `)}
        `}
      >
        <Col
          css={css`
            ${colBaseCss};
            flex: 0 0 ${kSmallCardWidth}px;
          `}
        >
          <ChainActionBar
            side="left"
            nid={this.props.nid}
            nidIsPrivate={nodeIsPrivate}
            abortSignal={this.createNodeAbortController.signal}
            addRef={this.addRef}
            css={css`
              margin: 0 0 6px auto;
              ${styleMobileTouchOnly(css`
                width: 50%;
              `)}
            `}
          />
          <NodeRefs
            side="left"
            nid={this.props.nid}
            edges={edges_left}
            cutOffRef={this.cutOffRef}
            switchStickiness={this.switchStickiness}
          />
        </Col>
        <Col
          css={css`
            ${colBaseCss};
            flex: 0 1 420px;
            margin: 0 8px 0 8px;
            width: 420px;
          `}
        >
          <WideCard>
            {nodeCard}
            <FullCardFootbar node={node} />
          </WideCard>
        </Col>
        <Col
          css={css`
            ${colBaseCss};
            flex: 1 1;
          `}
        >
          <ChainActionBar
            side="right"
            nid={this.props.nid}
            nidIsPrivate={nodeIsPrivate}
            abortSignal={this.createNodeAbortController.signal}
            addRef={this.addRef}
            css={css`
              margin: 0 auto 6px 0;
              ${styleMobileTouchOnly(css`
                width: 50%;
              `)}
            `}
          />
          <NodeRefs
            side="right"
            nid={this.props.nid}
            edges={edges_right}
            cutOffRef={this.cutOffRef}
            switchStickiness={this.switchStickiness}
          />
        </Col>
      </Row>
    )
  }
}

Triptych.contextType = MzdGlobalContext
