import React from "react";

import styles from "./SearchGrid.module.css";

import PropTypes from "prop-types";
import moment from "moment";
import axios from "axios";
import { Container, Row, Col } from "react-bootstrap";
import { withRouter } from "react-router-dom";

import NodeSmallCard from "./../NodeSmallCard";
import remoteErrorHandler from "./../remoteErrorHandler";

import { joinClasses } from "./../util/elClass.js";

function range(n, start, end) {
  if (start == null) {
    start = 0;
  }
  if (end == null) {
    end = n;
  }
  return new Array(n).fill(undefined).map((_, i) => i + start);
}

class DynamicGrid extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      width: 640,
      height: 480,
      ncols: 1,
    };
    this.rowRef = React.createRef();
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
    const fontSize = parseFloat(
      getComputedStyle(document.documentElement).fontSize
    );
    const fn = (cardWidth) => {
      const nf = window.innerWidth / (fontSize * (1 + cardWidth));
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
    const opt = fn(19);
    const ncols = Math.max(1, opt[1]);
    this.setState({
      width: window.innerWidth,
      height: window.innerHeight,
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
      <Container fluid className={joinClasses(styles.grid_container)}>
        <Row
          ref={this.rowRef}
          className="justify-content-between w-100 p-0 m-0"
        >
          {columns}
        </Row>
      </Container>
    );
  }
}

class SearchGrid extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      nodes: [],
      since_days_ago: 0,
    };
    this.fetchCancelToken = axios.CancelToken.source();
  }

  static propTypes = {
    history: PropTypes.object.isRequired,
  };

  componentDidMount() {
    window.addEventListener("scroll", this.handleScroll, { passive: true });
    this.fetchData();
  }

  componentWillUnmount() {
    this.fetchCancelToken.cancel();
    window.removeEventListener("scroll", this.handleScroll);
  }

  componentDidUpdate(prevProps) {
    if (this.props.q !== prevProps.q) {
      this.setState({ cards: [], since_days_ago: 0 });
      this.fetchData();
    }
  }

  fetchData = () => {
    this.fetchDataIteration(30, 0);
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
      .catch(remoteErrorHandler(this.props.history));
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
    const cards = this.state.nodes
      .filter((item) => {
        if (item.nid in used) {
          console.log("Search grid overlap", item.nid, item);
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
          />
        );
      });
    return <DynamicGrid cards={cards} />;
  }
}

export default withRouter(SearchGrid);
