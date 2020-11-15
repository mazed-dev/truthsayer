import React from "react";

import styles from "./NodeSmallCard.module.css";

import PropTypes from "prop-types";
import moment from "moment";
import { Card } from "react-bootstrap";
import { withRouter } from "react-router-dom";

// import { MdSmallCardRender } from "./markdown/MarkdownRender";
import { SmallCardRender, exctractDoc } from "./doc/doc";
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
    this.fetchEdgesCancelToken = axios.CancelToken.source();
    this.fetchPrefaceCancelToken = axios.CancelToken.source();
    this.state = {
      doc: null,
      crtd: this.props.crtd,
      upd: this.props.upd,
      edges: [],
    };
  }

  static propTypes = {
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
  };

  componentDidUpdate(prevProps) {
    if (this.props.nid !== prevProps.nid) {
      if (this.state.preface == null) {
        this.fetchPreface();
      } else {
        this.setState({
          doc: exctractDoc(this.props.preface),
        });
      }
    }
  }

  componentDidMount() {
    if (this.state.preface == null) {
      this.fetchPreface();
    } else {
      this.setState({
        doc: exctractDoc(this.props.preface),
      });
    }
  }

  componentWillUnmount() {
    this.fetchEdgesCancelToken.cancel();
    this.fetchPrefaceCancelToken.cancel();
  }

  onClick = () => {
    this.props.history.push({
      pathname: "/node/" + this.props.nid,
    });
  };

  fetchPreface = () => {
    axios
      .get("/api/node/" + this.props.nid, {
        cancelToken: this.fetchPrefaceCancelToken.token,
      })
      .catch((error) => {
        console.log("Fetch node failed with error:", error);
      })
      .then((res) => {
        if (res) {
          this.setState({
            doc: exctractDoc(res.data),
            crtd: moment(res.headers["x-created-at"]),
            upd: moment(res.headers["last-modified"]),
          });
        }
      });
  };

  render() {
    const upd = this.state.upd ? moment(this.state.upd).fromNow() : "";
    const shd = getShadowStyle(
      this.props.edges.length +
        this.state.edges.length -
        (this.props.skip_input_edge ? 1 : 0)
    );
    return (
      <Card
        className={joinClasses(shd, styles.small_card, styles.small_card_width)}
        onClick={this.onClick}
        nid={this.props.nid}
        ref={this.props.cardRef}
      >
        <Card.Body className="px-3 pt-2 pb-0">
          <SmallCardRender doc={this.state.doc} nid={this.props.nid} head={2} />
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

NodeSmallCard.defaultProps = { skip_input_edge: false, edges: [] };

export default withRouter(NodeSmallCard);
