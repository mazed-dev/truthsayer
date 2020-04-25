import React from "react";
import { withRouter } from "react-router-dom";

import NodeSmallCard from "./NodeSmallCard";
import TopToolBar from "./TopToolBar";

import { Container, CardColumns } from "react-bootstrap";

import axios from "axios";
import PropTypes from "prop-types";
import queryString from "query-string";

class SearchView extends React.Component {
  static propTypes = {
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    const params = queryString.parse(this.props.location.search);
    this.state = {
      q: params.q,
      nodes: [],
    };
  }

  handleChange = (q) => {
    this.setState({ q: q });
    this.fetchData(q);
    this.props.history.push({
      pathname: "/search",
      search: queryString.stringify({ q: q }),
    });
  };

  componentDidMount() {
    this.fetchData(this.state.q);
  }

  fetchData = (q) => {
    axios.get("/node/search?q=" + q).then((res) => {
      this.setState({ nodes: res.data.nodes });
    });
  };

  render() {
    const tl = this.state.nodes.map((nmeta) => {
      return (
        <NodeSmallCard
          nid={nmeta.id}
          title={nmeta.title}
          preface={nmeta.preface}
          crtd={nmeta.crtd}
          upd={nmeta.upd}
          key={nmeta.id}
        />
      );
    });
    return (
      <>
        <TopToolBar callback={this.handleChange} value={this.state.q} />
        <Container>
          <CardColumns>{tl}</CardColumns>
        </Container>
      </>
    );
  }
}

export default withRouter(SearchView);
