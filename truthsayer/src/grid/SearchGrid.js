import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router-dom'
import { Container, Row, Col } from 'react-bootstrap'

import { SmallCard } from './../card/SmallCard'
import { SCard } from './../card/ShrinkCard'
import { TimeBadge } from './../card/AuthorBadge'
import { SmallCardRender } from './../doc/ReadOnlyRender'

import { searchNodeFor } from './search/search'

import { smuggler } from 'smuggler-api'

import { jcss } from 'elementary'
import { range } from './../util/range'
import { isSmartCase } from './../util/str.jsx'

import { MzdGlobalContext } from '../lib/global'
import { Loader } from './../lib/loader'

import * as log from '../util/log'
import { isAbortError } from '../util/exception'

import styles from './SearchGrid.module.css'

import lodash from 'lodash'

export const GridCard = React.forwardRef(
  ({ onClick, className, children }, ref) => {
    className = jcss(styles.grid_cell, className)
    return (
      <SmallCard onClick={onClick} className={className} ref={ref}>
        {children}
      </SmallCard>
    )
  }
)

class DynamicGrid extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      width: 640,
      height: 480,
      ncols: 1,
    }
    this.containerRef = React.createRef()
  }

  componentDidMount() {
    this.updateWindowDimensions()
    window.addEventListener('resize', this.updateWindowDimensions)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateWindowDimensions)
  }

  updateWindowDimensions = () => {
    const containerEl = this.containerRef.current
    const width = containerEl.clientWidth || window.innerWidth
    const height = containerEl.clientHeight || window.innerHeight
    const fontSize = parseFloat(
      getComputedStyle(document.documentElement).fontSize
    )
    const fn = (cardWidth) => {
      const nf = width / (fontSize * cardWidth)
      let n = Math.floor(nf)
      const delta = nf - n
      if (delta > 0.8) {
        n = n + 1
      }
      return n
    }
    const ncols = Math.max(2, fn(14))
    this.setState({
      width,
      height,
      ncols,
    })
  }

  render() {
    const colWidth = Math.floor(100 / this.state.ncols)
    const columnStyle = {
      width: `${colWidth}%`,
    }
    const columns = range(this.state.ncols).map((_, col_ind) => {
      const colCards = this.props.children.filter((_, card_ind) => {
        return card_ind % this.state.ncols === col_ind
      })
      return (
        <Col
          className={styles.grid_col}
          style={columnStyle}
          key={`cards_column_${col_ind}`}
        >
          {colCards}
        </Col>
      )
    })
    return (
      <Container
        fluid
        className={jcss(styles.grid_container)}
        ref={this.containerRef}
      >
        <Row className={jcss('justify-content-between', styles.grid_row)}>
          {columns}
        </Row>
      </Container>
    )
  }
}

const _kTimeLimit = Math.floor(Date.now() / 1000) - 2 * 356 * 24 * 60 * 60
const _kSearchWindowSeconds = 21 * 24 * 60 * 60

export type NodeAttrsSearchItem = {
  nid: string,
  // ntype: i32,
  // crtd: u64,
  // upd: u64,
  // attrs: Optional<String>,
  // data: Optional<String>,
  // meta: Optional<NodeMetaPub>,
}

class SearchGridImpl extends React.Component {
  constructor(props, context) {
    super(props, context)
    this.state = {
      nodes: [],
      pattern: this.makePattern(),
      fetching: false,
      end_time: null,
      start_time: null,
      offset: 0,
    }
    this.fetchAbortController = new AbortController()
    this.ref = React.createRef()
  }

  componentDidMount() {
    if (!this.props.portable) {
      window.addEventListener('scroll', this.handleScroll, { passive: true })
    }
    this.fetchData()
  }

  componentWillUnmount() {
    this.fetchAbortController.abort()
    if (!this.props.portable) {
      window.removeEventListener('scroll', this.handleScroll)
    }
  }

  componentDidUpdate(prevProps) {
    // We need to re-featch only on changes to the search parameters,
    // changes to extCards or on changes to account from global context.
    // console.log("componentDidUpdate", prevProps, this.props);
    if (
      this.props.q !== prevProps.q ||
      this.props.extCards !== prevProps.extCards
    ) {
      // console.log("SearchGridImpl::componentDidUpdate -> fetchData");
      this.fetchData()
    }
  }

  static propTypes = {
    history: PropTypes.object.isRequired,
  }

  makePattern() {
    const { q } = this.props
    if (q == null || q.length < 2) {
      return null
    }
    // TODO(akindyakov) Use multiline search here
    const flags = isSmartCase(this.props.q) ? '' : 'i'
    return new RegExp(this.props.q, flags)
  }

  fetchData = () => {
    if (
      !this.props.defaultSearch &&
      (this.props.q == null || this.props.q.length < 2)
    ) {
      return
    }
    this.setState(
      {
        nodes: [],
        pattern: this.makePattern(),
        offset: 0,
        end_time: null,
        start_time: null,
        fetching: true,
      },
      this.secureSearchIteration
    )
  }

  secureSearchIteration = () => {
    const end_time = this.state.end_time
    const start_time = this.state.start_time
    const offset = this.state.offset
    const account = this.props.account
    smuggler.node
      .slice({
        start_time,
        end_time,
        offset,
        signal: this.fetchAbortController.signal,
        account,
      })
      .then((data) => {
        if (!data) {
          return
        }
        const { nodes, start_time, offset, full_size, end_time } = data
        const { pattern } = this.state
        if (pattern) {
          nodes.forEach((node) => {
            node = searchNodeFor(node, pattern)
            if (node) {
              this.setState((state) => {
                return { nodes: lodash.concat(state.nodes, node) }
              })
            }
          })
        } else {
          this.setState((state) => {
            return { nodes: lodash.concat(state.nodes, nodes) }
          })
        }
        let next = null
        let newFetching = false
        if (this.isScrolledToBottom() && start_time > _kTimeLimit) {
          next = this.secureSearchIteration
          newFetching = true
        }
        let newEndTime
        let newStartTime
        let newOffset
        if (this.isTimeIntervalExhausted(nodes.length, offset, full_size)) {
          newEndTime = start_time
          newStartTime = start_time - _kSearchWindowSeconds
          newOffset = 0
        } else {
          newEndTime = end_time
          newStartTime = start_time
          newOffset = offset + nodes.length
        }
        this.setState(
          {
            end_time: newEndTime,
            start_time: newStartTime,
            offset: newOffset,
            fetching: newFetching,
          },
          next
        )
      })
      .catch((err) => {
        if (isAbortError(err)) {
          return
        }
        log.exception(err)
      })
  }

  isTimeIntervalExhausted = (length, offset, full_size) => {
    return !(length + offset < full_size)
  }

  isScrolledToBottom = () => {
    if (this.props.portable) {
      const scrollTop = this.ref.current.scrollTop
      const scrollTopMax = this.ref.current.scrollTopMax
      return scrollTop === scrollTopMax
    }
    const innerHeight = window.innerHeight
    const scrollTop = document.documentElement.scrollTop
    const offsetHeight = document.documentElement.offsetHeight
    return innerHeight + scrollTop >= offsetHeight
  }

  handleScroll = () => {
    if (!this.state.fetching && this.isScrolledToBottom()) {
      this.secureSearchIteration()
    }
  }

  render() {
    const { account, onCardClick, children = [] } = this.props
    if (account == null) {
      return (
        <div className={styles.search_grid_waiter}>
          <Loader size={'large'} />
        </div>
      )
    }

    const used = {}
    let cards = this.state.nodes
      .filter((node) => {
        const { nid } = node
        if (nid in used) {
          //* dbg*/ console.log("Search grid overlap", node.nid, item);
          return false
        }
        used[nid] = true
        return true
      })
      .map((node) => {
        const { nid } = node
        const onClick = () => {
          if (onCardClick) {
            onCardClick(node)
          } else {
            this.props.history.push({
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
    cards = lodash.concat(children, cards)

    const fetchingLoader = this.state.fetching ? (
      <div className={styles.search_grid_loader}>
        <Loader size={'medium'} />
      </div>
    ) : null
    const gridStyle = this.props.portable ? styles.search_grid_portable : null
    return (
      <div
        className={jcss(gridStyle, styles.search_grid)}
        onScroll={this.handleScroll}
        ref={this.ref}
      >
        <DynamicGrid>{cards}</DynamicGrid>
        {fetchingLoader}
      </div>
    )
  }
}

const SearchGridRouter = withRouter(SearchGridImpl)

export function SearchGrid({ ...rest }) {
  const ctx = useContext(MzdGlobalContext)
  return <SearchGridRouter account={ctx.account} {...rest} />
}

export default SearchGrid
