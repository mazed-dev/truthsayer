import React from "react";

import styles from "./SearchGrid.module.css";

// import PropTypes from "prop-types";
import moment from "moment";
import axios from "axios";
import { Container, Row, Col } from "react-bootstrap";
import { withRouter } from "react-router-dom";

import NodeSmallCard from "./../NodeSmallCard";
import remoteErrorHandler from "./../remoteErrorHandler";

import { searchNodesInAttrs } from "./../search/search.js";
import { extractIndexNGramsFromText } from "./../search/ngramsIndex.js";

import { smugler } from "./../smugler/api.js";

import { joinClasses } from "./../util/elClass.js";

import { range } from "./../util/range";
import { Loader } from "./../lib/loader";

class DynamicGrid extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      width: 640,
      height: 480,
      ncols: 1,
    };
    this.containerRef = React.createRef();
  }

  componentDidMount() {
    this.updateWindowDimensions();
    window.addEventListener("resize", this.updateWindowDimensions);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateWindowDimensions);
  }

  updateWindowDimensions = () => {
    const containerEl = this.containerRef.current;
    const width = containerEl.clientWidth || window.innerWidth;
    const height = containerEl.clientHeight || window.innerHeight;
    const fontSize = parseFloat(
      getComputedStyle(document.documentElement).fontSize
    );
    const fn = (cardWidth) => {
      const nf = width / (fontSize * (1 + cardWidth));
      const n = Math.floor(nf);
      const delta = nf - n;
      return [delta, n];
    };
    // const opt = range(4, 16)
    //   .map((cardWidth) => fn(cardWidth))
    //   .reduce((opt, cur) => {
    //     if (cur[0] > 0.1 && cur[0] < opt[0]) {
    //       return cur;
    //     }
    //     return opt;
    //   }, [1, 1]);
    const [delta, cardsN] = fn(19);
    const ncols = Math.max(1, cardsN);
    this.setState({
      width: width,
      height: height,
      ncols: ncols,
    });
  };

  render() {
    const columns = range(this.state.ncols).map((_, col_ind) => {
      const colCards = this.props.cards.filter((_, card_ind) => {
        return card_ind % this.state.ncols === col_ind;
      });
      return (
        <Col
          className={joinClasses(styles.grid_col)}
          key={"cards_column_" + col_ind}
        >
          {colCards}
        </Col>
      );
    });
    return (
      <Container
        fluid
        className={joinClasses(styles.grid_container)}
        ref={this.containerRef}
      >
        <Row className="justify-content-between w-100 p-0 m-0">{columns}</Row>
      </Container>
    );
  }
}

const _kTimeWindowSizeSeconds = 4 * 7 * 24 * 60 * 60;
const _kTimeLimit = Math.floor(Date.now() / 1000) - 2 * 356 * 24 * 60 * 60;
const _kChunkSizeMax = 256;

export class SearchGrid extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      nodes: [],
      ngrams: this.extractIndexNGramsFromText(),
      fetching: false,
      end_time: null,
      start_time: null,
      offset: 0,
    };
    this.fetchCancelToken = axios.CancelToken.source();
    this.ref = React.createRef();
  }

  componentDidMount() {
    if (!this.props.portable) {
      window.addEventListener("scroll", this.handleScroll, { passive: true });
    }
    this.fetchData();
  }

  componentWillUnmount() {
    this.fetchCancelToken.cancel();
    if (!this.props.portable) {
      window.removeEventListener("scroll", this.handleScroll);
    }
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.q !== prevProps.q ||
      this.props.extCards !== prevProps.extCards ||
      this.props.account !== prevProps.account
    ) {
      this.fetchData();
    }
  }

  extractIndexNGramsFromText = () => {
    return this.props.q && this.props.q.length > 2
      ? extractIndexNGramsFromText(this.props.q)
      : null;
  };

  fetchData = () => {
    if (this.props.account == null) {
      return;
    }
    if (
      !this.props.defaultSearch &&
      (this.props.q == null || this.props.q.length < 2)
    ) {
      return;
    }
    this.setState(
      {
        nodes: [],
        ngrams: this.extractIndexNGramsFromText(),
        offset: 0,
        end_time: null,
        start_time: null,
        fetching: true,
      },
      this.secureSearchIteration
    );
    // const upd_days_ago_after = 30;
    // const upd_days_ago_before = 0;
    // const offset = 0;
    // this.secureSearchIteration(
    // upd_days_ago_after,
    // upd_days_ago_before,
    // offset,
    // );
  };

  secureSearchIteration = () => {
    let end_time = this.state.end_time;
    let start_time = this.state.start_time;
    let offset = this.state.offset;
    smugler.node
      .slice({
        start_time: start_time,
        end_time: end_time,
        offset: offset,
        cancelToken: this.fetchCancelToken.token,
        crypto: this.props.account.getLocalCrypto(),
      })
      .then((data) => {
        if (!data) {
          console.error("Error: no response from back end");
          return;
        }
        const nodes = searchNodesInAttrs(data.items, this.state.ngrams);
        let next = null;
        let fetching = false;
        if (this.isScrolledToBottom() && data.start_time > _kTimeLimit) {
          //next = this.secureSearchIteration;
          //fetching = true;
        }
        if (
          this.isTimeIntervalExhausted(
            data.items.length,
            data.offset,
            data.full_size
          )
        ) {
          end_time = data.start_time;
          start_time = data.start_time - (data.end_time - data.start_time);
          offset = 0;
        } else {
          end_time = data.end_time;
          start_time = data.start_time;
          offset = data.offset + data.items.length;
        }
        this.setState((state) => {
          return {
            nodes: state.nodes.concat(nodes),
            end_time: end_time,
            start_time: start_time,
            offset: offset,
            fetching: fetching,
          };
        }, next);
      })
      .catch((error) => {
        console.log("Error", error);
      });
  };

  isTimeIntervalExhausted = (length, offset, full_size) => {
    return !(length + offset < full_size);
  };

  isScrolledToBottom = () => {
    if (this.props.portable) {
      const scrollTop = this.ref.current.scrollTop;
      const scrollTopMax = this.ref.current.scrollTopMax;
      return scrollTop === scrollTopMax;
    }
    const innerHeight = window.innerHeight;
    const scrollTop = document.documentElement.scrollTop;
    const offsetHeight = document.documentElement.offsetHeight;
    return innerHeight + scrollTop >= offsetHeight;
  };

  handleScroll = (e) => {
    if (this.isScrolledToBottom() && !this.state.fetching) {
      this.secureSearchIteration();
    }
  };

  render() {
    if (this.props.account == null) {
      return (
        <div className={styles.search_grid_waiter}>
          <Loader size={"large"} />;
        </div>
      );
    }
    var used = {};
    let cards = this.state.nodes
      .filter((item) => {
        if (item.nid in used) {
          //*dbg*/ console.log("Search grid overlap", item.nid, item);
          return false;
        }
        used[item.nid] = true;
        return true;
      })
      .map((item) => {
        return (
          <NodeSmallCard
            nid={item.nid}
            preface={item.preface}
            crtd={item.crtd}
            upd={item.upd}
            key={item.nid}
            skip_input_edge={false}
            edges={item.edges}
            clickable={true}
            onClick={this.props.onCardClick}
            account={this.props.account}
          />
        );
      });

    const fetchingLoader = this.state.fetching ? (
      <div className={styles.search_grid_loader}>
        <Loader size={"medium"} />
      </div>
    ) : null;
    if (this.props.extCards) {
      cards = this.props.extCards.concat(cards);
    }
    const gridStyle = this.props.portable ? styles.search_grid_portable : null;
    return (
      <div
        className={joinClasses(gridStyle, styles.search_grid)}
        onScroll={this.handleScroll}
        ref={this.ref}
      >
        <DynamicGrid cards={cards} />
        {fetchingLoader}
      </div>
    );
  }
}

SearchGrid.defaultProps = {
  defaultSearch: true,
  portable: false,
  onCardClick: null,
  extCards: null,
};

export default SearchGrid;
