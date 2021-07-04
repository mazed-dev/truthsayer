import React from 'react'

import styles from './Triptych.module.css'

import { WideCard } from './WideCard'
import { DocEditor } from '../doc/DocEditor.tsx'

import { SmallCard } from './SmallCard'
import { ShrinkCard } from './ShrinkCard'
import { ReadOnlyRender } from './../doc/ReadOnlyRender'

import { SmallCardFootbar } from './SmallCardFootbar'
import { FullCardFootbar } from './FullCardFootbar'

import { withRouter } from 'react-router-dom'

import { MzdGlobalContext } from '../lib/global.js'
import { jcss } from './../util/jcss'
import { debug } from './../util/log'

import { smugler } from '../smugler/api.js'

import { Row, Col } from 'react-bootstrap'

import { Loader } from '../lib/loader'

const lodash = require('lodash')

function RefNodeCard({ nid, edge, switchStickiness, cutOffRef }) {
  // See more / less button should go to a footbar
  return (
    <SmallCard className={styles.grid_cell}>
      <ShrinkCard>
        <ReadOnlyRender nid={nid} />
      </ShrinkCard>
      <SmallCardFootbar
        edge={edge}
        nid={nid}
        switchStickiness={switchStickiness}
        cutOffRef={cutOffRef}
      />
    </SmallCard>
  )
}

class NodeRefs extends React.Component {
  render() {
    const refs = this.props.edges.map((edge) => {
      let to_nid = null
      let from_nid = null
      let nid = null
      if (edge.from_nid === this.props.nid) {
        from_nid = edge.from_nid
        nid = edge.to_nid
      } else {
        to_nid = edge.to_nid
        nid = edge.from_nid
      }
      return (
        <RefNodeCard
          nid={nid}
          edge={edge}
          switchStickiness={this.props.switchStickiness}
          cutOffRef={this.props.cutOffRef}
          key={edge.eid}
        />
      )
    })
    return <div className={this.props.className}>{refs}</div>
  }
}

function NodeCard({ node, addRef, stickyEdges, saveDoc }) {
  const editor =
    node != null ? (
      <DocEditor className={styles.editor} node={node} saveDoc={saveDoc} />
    ) : (
      <Loader />
    )
  const reloadNode = () => {}
  return (
    <WideCard>
      {editor}
      <FullCardFootbar
        addRef={addRef}
        node={node}
        stickyEdges={stickyEdges}
        reloadNode={reloadNode}
      />
    </WideCard>
  )
}

class Triptych extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      node: null,
      edges_left: [],
      edges_right: [],
      edges_sticky: [],
      is_narrow: false,
    }
    this.fetchToEdgesCancelToken = smugler.makeCancelToken()
    this.fetchFromEdgesCancelToken = smugler.makeCancelToken()
    this.fetchNodeCancelToken = smugler.makeCancelToken()
    this.createEdgeCancelToken = smugler.makeCancelToken()
  }

  componentDidMount() {
    this.fetchEdges()
    this.fetchNode()
    this.updateWindowDimensions()
    window.addEventListener('resize', this.updateWindowDimensions)
  }

  componentWillUnmount() {
    this.fetchToEdgesCancelToken.cancel()
    this.fetchFromEdgesCancelToken.cancel()
    this.fetchNodeCancelToken.cancel()
    window.removeEventListener('resize', this.updateWindowDimensions)
  }

  componentDidUpdate(prevProps) {
    // Don't forget to compare props!
    if (this.props.nid !== prevProps.nid) {
      this.fetchEdges()
      this.fetchNode()
    }
  }

  updateWindowDimensions = () => {
    this.setState({
      is_narrow: window.innerWidth < 480 /* pixels*/,
    })
  }

  fetchEdges = () => {
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

  fetchNode = () => {
    const nid = this.props.nid
    const account = this.context.account
    return smugler.node
      .get({
        nid,
        cancelToken: this.fetchNodeCancelToken.token,
        account,
      })
      .then((node) => {
        if (node) {
          this.setState({
            node,
          })
        }
      })
  }

  saveDoc = lodash.debounce((doc) => {
    // TODO(akindyakov): move conversion from raw slate to doc to here
    // TODO(akindyakov): collect stats here
    const account = this.context.account
    return smugler.node
      .update({
        nid: this.props.nid,
        doc,
        cancelToken: this.fetchNodeCancelToken.token,
        account,
      })
      .then((resp) => {
        // this.setState((state) => {
        //   let node = state.node;
        //   node.doc = doc;
        //   return { node: node };
        // });
        return resp
      })
  }, 1200)

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
      <NodeCard
        node={this.state.node}
        addRef={this.addRef}
        stickyEdges={this.state.edges_sticky}
        saveDoc={this.saveDoc}
      />
    )
    let triptychRow = null
    if (!this.state.is_narrow) {
      triptychRow = (
        <Row className={jcss('d-flex', 'justify-content-center', styles.row)}>
          <Col className={styles.refs_col}>{leftRefs}</Col>
          <Col className={styles.node_card_col}>{nodeCard}</Col>
          <Col className={styles.refs_col}>{rightRefs}</Col>
        </Row>
      )
    } else {
      triptychRow = (
        <>
          <div className={styles.node_card_col}>{nodeCard}</div>
          <Row className={jcss('d-flex', 'justify-content-center', styles.row)}>
            <Col className={jcss(styles.refs_col, styles.refs_left_col)}>
              {leftRefs}
            </Col>
            <Col className={jcss(styles.refs_col, styles.refs_right_col)}>
              {rightRefs}
            </Col>
          </Row>
        </>
      )
    }
    return <>{triptychRow}</>
  }
}

Triptych.contextType = MzdGlobalContext

export default withRouter(Triptych)
