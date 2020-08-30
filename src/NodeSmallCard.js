import React from "react";

import "./NodeSmallCard.css";

import PropTypes from "prop-types";
import moment from "moment";
import { Card } from "react-bootstrap";
import { withRouter } from "react-router-dom";

import maze from "./maze.png";
import { MdSmallCardRender } from "./MarkDownRender";

class NodeSmallCard extends React.Component {
  constructor(props) {
    super(props);
  }

  static propTypes = {
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
  };

  onClick = () => {
    this.props.history.push({
      pathname: "/node/" + this.props.nid,
    });
  };

  render() {
    const upd = moment.unix(this.props.upd).fromNow();
    return (
      <Card className="mazed_small_card" onClick={this.onClick}>
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

export default withRouter(NodeSmallCard);
