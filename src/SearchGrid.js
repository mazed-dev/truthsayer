import React from "react";

import "./SearchGrid.css";

import PropTypes from "prop-types";
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
  console.log(n, start, end);
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
      nodes: [],
    };
    this.fetchCancelToken = axios.CancelToken.source();
  }

  static propTypes = {
    history: PropTypes.object.isRequired,
  };

  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate(prevProps) {
    if (this.props.q !== prevProps.q) {
      this.setState({ nodes: [] });
      this.fetchData();
    }
  }

  componentWillUnmount() {
    this.fetchCancelToken.cancel();
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
        const all = this.state.nodes.length + res.data.nodes.length;
        console.log(res.data.nodes);
        this.setState((state) => {
          return {
            nodes: state.nodes.concat(res.data.nodes),
          };
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

  render() {
    const cards = this.state.nodes.map((meta) => {
      console.log("Nid", meta.nid);
      return (
        <NodeSmallCard
          nid={meta.nid}
          preface={meta.preface}
          crtd={meta.crtd}
          upd={meta.upd}
          key={meta.nid}
          skip_input_edge={false}
        />
      );
    });
    return <DynamicGrid cards={cards} />;
  }
}

export default withRouter(SearchGrid);
