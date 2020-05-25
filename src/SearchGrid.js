import React from "react";
import { withRouter } from "react-router-dom";

import "./SearchGrid.css";

import axios from "axios";
import PropTypes from "prop-types";

import { Container, CardColumns } from "react-bootstrap";

import NodeSmallCard from "./NodeSmallCard";

import remoteErrorHandler from "./remoteErrorHandler";

class SearchGrid extends React.Component {
  static propTypes = {
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      nodes: [],
    };
    this.fetchCancelToken = axios.CancelToken.source();
  }

  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate(prevProps) {
    if (this.props.q !== prevProps.q) {
      this.fetchData();
    }
  }

  componentWillUnmount() {
    this.fetchCancelToken.cancel("Operation canceled by the user.");
  }

  fetchData = () => {
    const req = {
      q: this.props.q,
    };
    axios
      .post("/api/node-search", req, {
        cancelToken: this.fetchCancelToken.token,
      })
      .then((res) => {
        this.setState({ nodes: res.data.nodes });
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
