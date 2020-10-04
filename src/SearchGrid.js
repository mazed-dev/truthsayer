import React from "react";

import "./SearchGrid.css";

import PropTypes from "prop-types";
import moment from "moment";
import axios from "axios";
import { Container, Row, Col } from "react-bootstrap";
import { withRouter } from "react-router-dom";

import NodeSmallCard from "./NodeSmallCard";
import remoteErrorHandler from "./remoteErrorHandler";

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
      ncols: 2,
    };
  }

  componentDidMount() {
    this.updateWindowDimensions();
    window.addEventListener("resize", this.updateWindowDimensions);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateWindowDimensions);
  }

  updateWindowDimensions = () => {
    this.setState({
      width: window.innerWidth,
      height: window.innerHeight,
      ncols: Math.max(
        1,
        Math.floor(
          window.innerWidth /
            // see NodeSmallCard.css.mazed_small_card.max-width
            (parseFloat(getComputedStyle(document.documentElement).fontSize) *
              20)
        )
      ),
    });
  };

  render() {
    const columns = range(this.state.ncols).map((_, col_ind) => {
      const cards = this.props.cards.filter((_, card_ind) => {
        return card_ind % this.state.ncols === col_ind;
      });
      return <Col key={"cards_" + col_ind}>{cards}</Col>;
    });
    return (
      <Container fluid>
        <Row className="justify-content-between w-100 p-0 m-0">{columns}</Row>
      </Container>
    );
  }
}

class SearchGrid extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      heads: [],
      nodes: [],
    };
    this.fetchCancelToken = axios.CancelToken.source();
    this.fetchHeadsCancelToken = axios.CancelToken.source();
  }

  static propTypes = {
    history: PropTypes.object.isRequired,
  };

  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate(prevProps) {
    if (this.props.q !== prevProps.q) {
      this.setState({ cards: [] });
      this.fetchData();
    }
  }

  componentWillUnmount() {
    this.fetchCancelToken.cancel();
    this.fetchHeadsCancelToken.cancel();
  }

  fetchData = () => {
    if (this.props.q == null || this.props.q === "") {
      this.fetchHeads();
    } else {
      this.fetchDataIteration(30, 0);
    }
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
        const all =
          this.state.heads.length +
          this.state.nodes.length +
          res.data.nodes.length;
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
          return { nodes: state.nodes.concat(nodes) };
        });
        if (all < 32 && upd_days_ago_after < 300 /* ~1 year */) {
          this.fetchDataIteration(
            upd_days_ago_after + 30,
            upd_days_ago_before + 30
          );
        }
      })
      .catch(remoteErrorHandler(this.props.history));
  };

  fetchHeads = () => {
    const req = {
      updated_after: 30,
    };
    axios
      .post("/api/heads-search", req, {
        cancelToken: this.fetchHeadsCancelToken.token,
      })
      .then((res) => {
        var heads = {};
        var nodes = res.data.edges
          .map((e) => {
            if (e.to_nid in heads) {
              heads[e.to_nid].edges.push(e.from_nid);
            } else {
              heads[e.to_nid] = {
                edges: [e.from_nid],
              };
            }
            return {
              nid: e.to_nid,
              preface: null,
              crtd: moment.unix(e.created_at),
              upd: moment.unix(e.updated_at),
            };
          })
          .map((e) => {
            e.edges = heads[e.nid].edges;
            return e;
          });
        nodes = nodes.concat(
          res.data.edges.map((e) => {
            return {
              nid: e.from_nid,
              preface: null,
              crtd: moment.unix(e.created_at),
              upd: moment.unix(e.updated_at),
              edges: [],
            };
          })
        );
        this.setState({
          heads: heads,
          nodes: nodes,
        });
        this.fetchDataIteration(30, 0);
      })
      .catch(remoteErrorHandler(this.props.history));
  };

  render() {
    var used = {};
    var cards = this.state.nodes
      .filter((item) => {
        if (item.nid in used) {
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
