import React, { useState } from 'react'

import { Row, Col } from 'react-bootstrap'

import styles from './Triptych.module.css'

import { FullCard } from './FullCard'

import { SmallCard } from './SmallCard'
import { ShrinkCard } from './ShrinkCard'
import { ReadOnlyRender } from './../doc/ReadOnlyRender'

import { SmallCardFootbar } from './SmallCardFootbar'
import { ChainActionBar } from './ChainActionBar'

import { withRouter } from 'react-router-dom'

import { MzdGlobalContext } from '../lib/global'
import { jcss } from './../util/jcss'
import { debug } from './../util/log'

import { smugler } from '../smugler/api'

const lodash = require('lodash')

function RefNodeCard({ nid, edge, switchStickiness, cutOffRef }) {
  const [showMore, setShowMore] = useState(false)
  const toggleMoreLess = () => setShowMore(!showMore)
  return (
    <SmallCard className={styles.ref_card}>
      <ShrinkCard showMore={showMore}>
        <ReadOnlyRender nid={nid} />
      </ShrinkCard>
      <SmallCardFootbar
        nid={nid}
        edge={edge}
        showMore={showMore}
        toggleMore={toggleMoreLess}
        switchStickiness={switchStickiness}
        cutOffRef={cutOffRef}
      />
    </SmallCard>
  )
}

function NodeRefs({ className, nid, edges, switchStickiness, cutOffRef }) {
  const refs = edges.map((edge) => {
    const refCardNid = edge.from_nid === nid ? edge.to_nid : edge.from_nid
    return (
      <RefNodeCard
        nid={refCardNid}
        edge={edge}
        switchStickiness={switchStickiness}
        cutOffRef={cutOffRef}
        key={edge.eid}
      />
    )
  })
  return <div className={className}>{refs}</div>
}

class Triptych extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      node: null,
      edges_left: [],
      edges_right: [],
      edges_sticky: [],
    }
    this.fetchToEdgesCancelToken = smugler.makeCancelToken()
    this.fetchFromEdgesCancelToken = smugler.makeCancelToken()
    this.fetchNodeCancelToken = smugler.makeCancelToken()
    this.createEdgeCancelToken = smugler.makeCancelToken()
    this.createNodeCancelToken = smugler.makeCancelToken()
  }

  componentDidMount() {
    this.fetchEdges()
    this.fetchNode()
  }

  componentWillUnmount() {
    this.fetchToEdgesCancelToken.cancel()
    this.fetchFromEdgesCancelToken.cancel()
    this.fetchNodeCancelToken.cancel()
  }

  componentDidUpdate(prevProps) {
    // Don't forget to compare props!
    if (this.props.nid !== prevProps.nid) {
      this.fetchEdges()
      this.fetchNode()
    }
  }

  fetchEdges = () => {
    this.setState({
      edges_left: [],
      edges_right: [],
      edges_sticky: [],
    })
    smugler.edge
      .getTo({
        nid: this.props.nid,
        cancelToken: this.fetchToEdgesCancelToken.token,
      })
      .then((star) => {
        if (star) {
          const edges_sticky = star.edges.filter((edge) => {
            return edge.is_sticky
          })
          this.setState((state) => {
            return {
              edges_left: star.edges,
              edges_sticky: state.edges_sticky.concat(edges_sticky),
            }
          })
        }
      })
    smugler.edge
      .getFrom({
        nid: this.props.nid,
        cancelToken: this.fetchToEdgesCancelToken.token,
      })
      .then((star) => {
        if (star) {
          const edges_sticky = star.edges.filter((edge) => {
            return edge.is_sticky
          })
          this.setState((state) => {
            return {
              edges_right: star.edges,
              edges_sticky: state.edges_sticky.concat(edges_sticky),
            }
          })
        }
      })
  }

  fetchNode = async () => {
    this.setState({ node: null })
    const nid = this.props.nid
    const account = this.context.account
    const node = await smugler.node.get({
      nid,
      cancelToken: this.fetchNodeCancelToken.token,
      account,
    })
    if (node) {
      this.setState({ node })
    }
  }

  saveNode = lodash.debounce(
    (node) => {
      if (this.props.nid !== node.nid) {
        throw Error(
          'Attempt to modify the node from the editor that belongs to a different node'
        )
      }
      // TODO(akindyakov): move conversion from raw slate to doc to here
      // TODO(akindyakov): collect stats here
      const account = this.context.account
      return smugler.node
        .update({
          node,
          cancelToken: this.fetchNodeCancelToken.token,
          account,
        })
        .then((resp) => {
          return resp
        })
    },
    757,
    {
      leading: true,
      maxWait: 1867,
      trailing: true,
    }
  )

  cutOffRef = (eid) => {
    this.setState((state) => {
      const rm = (edge) => edge.eid !== eid
      return {
        edges_left: state.edges_left.filter(rm),
        edges_right: state.edges_right.filter(rm),
        edges_sticky: state.edges_sticky.filter(rm),
      }
    })
  }

  addRef = ({ from, to }) => {
    const { nid } = this.props
    smugler.edge
      .create({
        from,
        to,
        cancelToken: this.createEdgeCancelToken.token,
      })
      .then((edge) => {
        this.setState((state) => {
          if (to === nid) {
            return {
              edges_left: state.edges_left.concat([edge]),
            }
          } else {
            return {
              edges_right: state.edges_right.concat([edge]),
            }
          }
        })
      })
  }

  switchStickiness = (edge, on = false) => {
    if (on) {
      edge.is_sticky = true
      this.setState((state) => {
        const new_sticky_edges = state.edges_sticky.concat([edge])
        return {
          edges_sticky: new_sticky_edges,
        }
      })
    } else {
      const rm = (e) => edge.eid !== e.eid
      this.setState((state) => {
        const filtered = state.edges_sticky.filter(rm)
        return {
          edges_sticky: filtered,
        }
      })
    }
  }

  render() {
    const leftRefs = (
      <NodeRefs
        nid={this.props.nid}
        edges={this.state.edges_left}
        cutOffRef={this.cutOffRef}
        switchStickiness={this.switchStickiness}
        className={styles.node_refs_left}
      />
    )
    const rightRefs = (
      <NodeRefs
        nid={this.props.nid}
        edges={this.state.edges_right}
        cutOffRef={this.cutOffRef}
        switchStickiness={this.switchStickiness}
      />
    )
    const nodeCard = (
      <FullCard
        node={this.state.node}
        addRef={this.addRef}
        stickyEdges={this.state.edges_sticky}
        saveNode={this.saveNode}
      />
    )
    const nodeIsPrivate = this.state.node?.isOwnedBy(this.context.account)
    return (
      <Row className={jcss(styles.row)}>
        <Col className={jcss(styles.refs_col, styles.col)}>
          <ChainActionBar
            side="left"
            nid={this.props.nid}
            nidIsPrivate={nodeIsPrivate}
            cancelToken={this.createNodeCancelToken.token}
            addRef={this.addRef}
          />
          {leftRefs}
        </Col>
        <Col className={jcss(styles.node_card_col, styles.col)}>{nodeCard}</Col>
        <Col className={jcss(styles.refs_col, styles.col)}>
          <ChainActionBar
            side="right"
            nid={this.props.nid}
            nidIsPrivate={nodeIsPrivate}
            cancelToken={this.createNodeCancelToken.token}
            addRef={this.addRef}
          />
          {rightRefs}
        </Col>
      </Row>
    )
  }
}

Triptych.contextType = MzdGlobalContext

export default withRouter(Triptych)
