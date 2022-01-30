// @ts-nocheck

import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router-dom'

import { SmallCard } from '../card/SmallCard'
import { SCard } from '../card/ShrinkCard'
import { TimeBadge } from '../card/AuthorBadge'
import { SmallCardRender } from '../doc/ReadOnlyRender'

import { searchNodeFor } from './search/search'

import { smuggler, TNodeSliceIterator } from 'smuggler-api'

import { jcss } from 'elementary'
import { isSmartCase } from '../util/str'

import { MzdGlobalContext } from '../lib/global'
import { Loader } from '../lib/loader'

import * as log from '../util/log'
import { isAbortError } from '../util/exception'

import { DynamicGrid } from './DynamicGrid'

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

class SearchGridImpl extends React.Component {
  ref: React.RefObject<HTMLDivElement>
  fetchAbortController?: AbortController
  pattern?: RegExp
  iter?: TNodeSliceIterator

  constructor(props, context) {
    super(props, context)
    this.state = {
      nodes: [],
      fetching: false,
    }
    this.ref = React.createRef()
  }

  componentDidMount() {
    if (!this.props.portable) {
      window.addEventListener('scroll', this.handleScroll, { passive: true })
    }
    this.fetchData()
  }

  componentWillUnmount() {
    this.fetchAbortController?.abort()
    if (!this.props.portable) {
      window.removeEventListener('scroll', this.handleScroll)
    }
  }

  componentDidUpdate(prevProps) {
    // We need to start fetching only on a change to the search parameters.
    if (this.props.q !== prevProps.q) {
      this.fetchData()
    }
  }

  static propTypes = {
    history: PropTypes.object.isRequired,
  }

  makePattern(): Optional<RegExp> {
    const { q } = this.props
    if (q == null || q.length < 2) {
      return null
    }
    // TODO(akindyakov) Use multiline search here
    const flags = isSmartCase(this.props.q) ? '' : 'i'
    return new RegExp(this.props.q, flags)
  }

  fetchData = () => {
    this.fetchAbortController?.abort()
    if (
      !this.props.defaultSearch &&
      (this.props.q == null || this.props.q.length < 2)
    ) {
      return
    }
    this.setState({
      nodes: [],
    })
    this.pattern = this.makePattern()
    this.fetchAbortController = new AbortController()
    this.iter = smuggler.node.slice({
      end_time: null,
      start_time: null,
      limit: null,
      signal: this.fetchAbortController.signal,
    })
    this.continueFetchingUntilScrolledToBottom()
  }

  continueFetchingUntilScrolledToBottom = async () => {
    const { iter, pattern, isScrolledToBottom } = this
    this.setState({ fetching: true })
    let toBeContinued = true
    while (toBeContinued && isScrolledToBottom()) {
      toBeContinued = await iter
        .next()
        .catch((err) => {
          if (!isAbortError(err)) {
            log.exception(err)
          }
          return false
        })
        .then((node) => {
          if (!node) {
            return false
          }
          if (!pattern || searchNodeFor(node, pattern)) {
            this.setState((state) => {
              return { nodes: lodash.concat(state.nodes, node) }
            })
          }
          return true
        })
    }
    this.setState({ fetching: false })
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
    return innerHeight + scrollTop + 200 >= offsetHeight
  }

  handleScroll = () => {
    if (!this.state.fetching && this.isScrolledToBottom()) {
      this.continueFetchingUntilScrolledToBottom()
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
