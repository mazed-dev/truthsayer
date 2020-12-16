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

import { joinClasses } from "./../util/elClass.js";

import { range } from "./../util/range";

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
    //* dbg */ console.log(
    //* dbg */   "updateWindowDimensions",
    //* dbg */   window.innerWidth,
    //* dbg */   window.innerHeight
    //* dbg */ );
    //* dbg */ see NodeSmallCard.css.mazed_small_card.max-width
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
      //* dbg */ console.log("delta", delta, n, cardWidth);
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

export class SearchGrid extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      nodes: [],
      since_days_ago: 0,
    };
    this.fetchCancelToken = axios.CancelToken.source();
  }

  componentDidMount() {
    window.addEventListener("scroll", this.handleScroll, { passive: true });
    this.fetchData();
  }

  componentWillUnmount() {
    this.fetchCancelToken.cancel();
    window.removeEventListener("scroll", this.handleScroll);
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.q !== prevProps.q ||
      this.props.extCards !== prevProps.extCards
    ) {
      this.setState({ nodes: [], since_days_ago: 0 });
      this.fetchData();
    }
  }

  fetchData = () => {
    var ngrams = null;
    if (
      !this.props.defaultSearch &&
      (this.props.q == null || this.props.q.length < 2)
    ) {
      return;
    }
    if (this.props.q != null) {
      ngrams = extractIndexNGramsFromText(this.props.q);
    }
    const upd_days_ago_after = 30;
    const upd_days_ago_before = 0;
    const offset = 0;
    this.secureSearchIteration(
      upd_days_ago_after,
      upd_days_ago_before,
      offset,
      ngrams
    );
  };

  secureSearchIteration = (
    upd_days_ago_after,
    upd_days_ago_before,
    offset,
    ngrams
  ) => {
    const req = {
      upd_after: upd_days_ago_after,
      upd_before: upd_days_ago_before,
      offset: offset || 0,
    };
    axios
      .post("/api/node-attrs-search", req, {
        cancelToken: this.fetchCancelToken.token,
      })
      .then((res) => {
        if (!res) {
          // TODO(akindyakov) escalate
          console.error("No response from back end");
          return;
        }
        const isTimeIntervalExhausted =
          res.data.items.length >= res.data.full_size;
        //*dbg*/ console.log(
        //*dbg*/   "Response from back end",
        //*dbg*/   res.data,
        //*dbg*/   upd_days_ago_after,
        //*dbg*/   upd_days_ago_before,
        //*dbg*/   offset,
        //*dbg*/   res.data.items.length,
        //*dbg*/   res.data.full_size,
        //*dbg*/   ngrams
        //*dbg*/ );
        const nodes = searchNodesInAttrs(res.data.items, ngrams);
        if (nodes.length === 0) {
          //*dbg*/ console.log(
          //*dbg*/   "Secure search found nothing, fall back to old search type",
          //*dbg*/   this.props.q
          //*dbg*/ );
          this.fetchDataIteration(upd_days_ago_after, upd_days_ago_before);
          return;
        }
        this.setState((state) => {
          return {
            nodes: state.nodes.concat(nodes),
            since_days_ago: upd_days_ago_after,
          };
        });
        //* dbg */ console.log(
        //* dbg */   "Scroll",
        //* dbg */   window.innerHeight,
        //* dbg */   document.documentElement.scrollTop,
        //* dbg */   document.documentElement.offsetHeight
        //* dbg */ );
        const screenIsFull =
          window.innerHeight + document.documentElement.scrollTop <
          document.documentElement.offsetHeight;
        if (!screenIsFull && upd_days_ago_after < 366 /* ~1 year */) {
          if (isTimeIntervalExhausted) {
            this.secureSearchIteration(
              upd_days_ago_after + 30,
              upd_days_ago_before + 30,
              0,
              ngrams
            );
          } else {
            this.secureSearchIteration(
              upd_days_ago_after,
              upd_days_ago_before,
              res.data.offset + 100,
              ngrams
            );
          }
        }
      })
      .catch((error) => {
        console.log("Error", error);
      });
    // .catch(remoteErrorHandler(this.props.history));
  };

  fetchDataIteration = (upd_days_ago_after, upd_days_ago_before) => {
    const req = {
      q: this.props.q,
      upd_after: upd_days_ago_after,
      upd_before: upd_days_ago_before,
      provide_edges: true,
    };
    axios
      .post("/api/node-search", req, {
        cancelToken: this.fetchCancelToken.token,
      })
      .then((res) => {
        const nodes = res.data.nodes.map((m) => {
          return {
            nid: m.nid,
            preface: m.preface,
            crtd: moment.unix(m.crtd),
            upd: moment.unix(m.upd),
            edges: [],
          };
        });
        this.setState((state) => {
          return {
            nodes: state.nodes.concat(nodes),
            since_days_ago: upd_days_ago_after,
          };
        });
        //* dbg */ console.log(
        //* dbg */   "Scroll",
        //* dbg */   window.innerHeight,
        //* dbg */   document.documentElement.scrollTop,
        //* dbg */   document.documentElement.offsetHeight
        //* dbg */ );
        const screenIsFull =
          window.innerHeight + document.documentElement.scrollTop <
          document.documentElement.offsetHeight;
        if (!screenIsFull && upd_days_ago_after < 366 /* ~1 year */) {
          this.fetchDataIteration(
            upd_days_ago_after + 30,
            upd_days_ago_before + 30
          );
        }
      })
      .catch((error) => {
        console.log("Error", error);
      });
    // .catch(remoteErrorHandler(this.props.history));
  };

  handleScroll = () => {
    //* dbg */ console.log(
    //* dbg */   "Scroll",
    //* dbg */   window.innerHeight,
    //* dbg */   document.documentElement.scrollTop,
    //* dbg */   document.documentElement.offsetHeight
    //* dbg */ );
    if (
      window.innerHeight + document.documentElement.scrollTop !==
      document.documentElement.offsetHeight
    ) {
      return;
    }
    //* dbg */ console.log(
    //* dbg */   "Fetch more list items",
    //* dbg */   this.state.since_days_ago + 30,
    //* dbg */   this.state.since_days_ago
    //* dbg */ );
    this.fetchDataIteration(
      this.state.since_days_ago + 30,
      this.state.since_days_ago
    );
  };

  render() {
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
          />
        );
      });
    if (this.props.extCards) {
      cards = this.props.extCards.concat(cards);
    }
    return <DynamicGrid cards={cards} />;
  }
}

SearchGrid.defaultProps = {
  defaultSearch: true,
  onCardClick: null,
  extCards: null,
};

// export default withRouter(SearchGrid);
export default SearchGrid;
