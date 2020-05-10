import React from "react";

import PropTypes from "prop-types";
import moment from "moment";
import { Card } from "react-bootstrap";
import { withRouter } from "react-router-dom";

import maze from "./maze.png";

// https://github.com/rexxars/react-markdown
import ReactMarkdown from "react-markdown";

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
      <Card className="rounded" onClick={this.onClick}>
        <Card.Body className="px-3 py-0 pm-0">
          <div className="d-flex justify-content-center">
            <Card.Img variant="top" className="w-25 p-0 m-2" src={maze} />
          </div>
          <ReactMarkdown source={this.props.preface} />
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

NodeSmallCard.defaultProps = {
  nid: 0,
  preface:
    "Some quick example text to build on the card title and make up the bulk of the card's content", //String,
  crtd: moment("2019-12-25").unix(),
  upd: moment("2019-12-25").unix(),
};

export default withRouter(NodeSmallCard);
