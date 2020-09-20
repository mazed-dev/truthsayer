import React from "react";

import styles from "./NodeSmallCard.module.css";

import PropTypes from "prop-types";
import moment from "moment";
import { Card } from "react-bootstrap";
import { withRouter } from "react-router-dom";

import { MdSmallCardRender } from "./markdown/MarkdownRender";
import remoteErrorHandler from "./remoteErrorHandler";

import { joinClasses } from "./util/elClass.js";

import axios from "axios";

function getShadowStyle(n) {
  switch (Math.max(0, n) /* treat negative numbers as 0 */) {
    case 0:
      return styles.small_card_shadow_0;
    case 1:
      return styles.small_card_shadow_1;
    case 2:
      return styles.small_card_shadow_2;
    case 3:
      return styles.small_card_shadow_3;
    case 4:
      return styles.small_card_shadow_4;
    default:
      break;
  }
  return styles.small_card_shadow_5;
}

class NodeSmallCard extends React.Component {
  constructor(props) {
    super(props);
    this.fetchCancelToken = axios.CancelToken.source();
    this.state = {
      edges: [],
    };
  }

  static propTypes = {
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
  };

  static propTypes = {
    location: PropTypes.object.isRequired,
  };

  componentDidMount() {
    this.fetchEdges();
  }

  componentWillUnmount() {
    this.fetchCancelToken.cancel();
  }

  onClick = () => {
    this.props.history.push({
      pathname: "/node/" + this.props.nid,
    });
  };

  fetchEdges = () => {
    axios
      .get("/api/node/" + this.props.nid + "/edge", {
        cancelToken: this.fetchCancelToken.token,
      })
      .catch(remoteErrorHandler(this.props.history))
      .then((res) => {
        if (res) {
          this.setState({
            edges: res.data.edges,
          });
        }
      });
  };

  render() {
    const upd = moment.unix(this.props.upd).fromNow();
    const shd = getShadowStyle(
      this.state.edges.length - (this.props.skip_input_edge ? 1 : 0)
    );
    return (
      <Card
        className={joinClasses(shd, styles.small_card)}
        onClick={this.onClick}
      >
        <Card.Body className="px-3 pt-2 pb-0">
          <MdSmallCardRender source={this.props.preface} />
          &hellip;
        </Card.Body>
        <footer className="text-muted text-right px-2 pb-2 m-0 pt-0">
          <small className="text-muted">
            <i>Updated {upd}</i>
          </small>
        </footer>
      </Card>
    );
  }
}

NodeSmallCard.defaultProps = { skip_input_edge: false };

export default withRouter(NodeSmallCard);
