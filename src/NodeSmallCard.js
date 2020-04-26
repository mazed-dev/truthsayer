import React from "react";

import PropTypes from "prop-types";
import moment from "moment";
import { Card } from "react-bootstrap";
import { withRouter } from "react-router-dom";

import maze from "./maze.png";

class NodeSmallCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      nid: props.nid, // i64,
      title: props.title, // String,
      preface: props.preface, //String,
      crtd: moment.unix(props.crtd), // SystemTime,
      upd: moment.unix(props.upd), // SystemTime,
    };
  }

  static propTypes = {
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
  };

  onClick = () => {
    this.props.history.push({
      pathname: "/node/" + this.state.nid,
    });
  };

  render() {
    const upd = this.state.upd.fromNow();
    return (
      <Card className="rounded" onClick={this.onClick}>
        <Card.Body className="p-3 m-0">
          <div className="d-flex justify-content-center">
            <Card.Img variant="top" className="w-25 p-0 m-2" src={maze} />
          </div>
          <Card.Title>{this.state.title}</Card.Title>
          <Card.Text>{this.state.preface}</Card.Text>
        </Card.Body>
        <footer className="text-muted text-right p-2">
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
  title: "Card Title", // String,
  preface:
    "Some quick example text to build on the card title and make up the bulk of the card's content", //String,
  crtd: moment("2019-12-25").unix(),
  upd: moment("2019-12-25").unix(),
};

export default withRouter(NodeSmallCard);
