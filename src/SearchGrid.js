import React from "react";

import "./SearchGrid.css";

import PropTypes from "prop-types";
import axios from "axios";
import { Container, CardColumns } from "react-bootstrap";
import { withRouter } from "react-router-dom";

import NodeSmallCard from "./NodeSmallCard";
import remoteErrorHandler from "./remoteErrorHandler";

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
    console.log("componentDidUpdate", this.props.q, prevProps.q);
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
    console.log("fetchDataIteration", upd_days_ago_after, upd_days_ago_before);
    const req = {
      q: this.props.q,
      upd_after: upd_days_ago_after,
      upd_before: upd_days_ago_before,
    };
    axios
      .post("/api/node-search", req, {
        cancelToken: this.fetchCancelToken.token,
      })
      .then((res) => {
        const all = this.state.nodes.length + res.data.nodes.length;
        console.log("fetchDataIteration -> got", res.data.nodes.length, all);
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
      return (
        <NodeSmallCard
          nid={meta.nid}
          preface={meta.preface}
          crtd={meta.crtd}
          upd={meta.upd}
          key={meta.nid}
        />
      );
    });
    return (
      <Container fluid>
        <CardColumns className="meta-search-card-columns">{cards}</CardColumns>
      </Container>
    );
  }
}

export default withRouter(SearchGrid);
