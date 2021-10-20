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

import { smuggler } from 'smuggler-api'

import lodash from 'lodash'

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
    this.fetchToEdgesAbortController = new AbortController()
    this.fetchFromEdgesAbortController = new AbortController()
    this.fetchNodeAbortController = new AbortController()
    this.createEdgeAbortController = new AbortController()
    this.createNodeAbortController = new AbortController()
  }

  componentDidMount() {
    this.fetchEdges()
    this.fetchNode()
  }

  componentWillUnmount() {
    this.fetchToEdgesAbortController.abort()
    this.fetchFromEdgesAbortController.abort()
    this.fetchNodeAbortController.abort()
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
    smuggler.edge
      .getTo({
        nid: this.props.nid,
        signal: this.fetchToEdgesAbortController.signal,
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
      .catch((err) => {
        if (err.name === 'AboutError') {
          return
        }
        // TODO(akindyakov): handle exceptions properly
      })
    smuggler.edge
      .getFrom({
        nid: this.props.nid,
        signal: this.fetchToEdgesAbortController.signal,
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
      .catch((err) => {
        if (err.name === 'AboutError') {
          return
        }
        // TODO(akindyakov): handle exceptions properly
      })
  }

  fetchNode = async () => {
    this.setState({ node: null })
    const nid = this.props.nid
    const account = this.context.account
    return smuggler.node
      .get({
        nid,
        signal: this.fetchNodeAbortController.signal,
        account,
      })
      .then((node) => {
        this.setState({ node })
      })
      .catch((err) => {
        if (err.name === 'AboutError') {
          return
        }
        // TODO(akindyakov): handle exceptions properly
      })
  }

  saveNode = lodash.debounce(
    (text) => {
      // TODO(akindyakov): move conversion from raw slate to doc to here
      // TODO(akindyakov): collect stats here
      const nid = this.props.nid
      return smuggler.node
        .update({
          nid,
          text,
          signal: this.fetchNodeAbortController.signal,
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
    smuggler.edge
      .create({
        from,
        to,
        signal: this.createEdgeAbortController.signal,
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
            abortControler={this.createNodeAbortController.signal}
            addRef={this.addRef}
            className={styles.ref_card}
          />
          {leftRefs}
        </Col>
        <Col className={jcss(styles.node_card_col, styles.col)}>{nodeCard}</Col>
        <Col className={jcss(styles.refs_col, styles.col)}>
          <ChainActionBar
            side="right"
            nid={this.props.nid}
            nidIsPrivate={nodeIsPrivate}
            abortControler={this.createNodeAbortController.signal}
            addRef={this.addRef}
            className={styles.ref_card}
          />
          {rightRefs}
        </Col>
      </Row>
    )
  }
}

Triptych.contextType = MzdGlobalContext

export default withRouter(Triptych)
