import React from "react";

import maze from "./maze.png";

import { Card } from "react-bootstrap";

import moment from "moment";

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

  render() {
    const upd = this.state.upd.fromNow();
    return (
      <Card className="rounded">
        <Card.Body className="p-3 m-0">
          <div className="d-flex justify-content-center">
            <Card.Img variant="top" className="w-25 p-0 m-2" src={maze} />
          </div>
          <Card.Title>{this.state.title}</Card.Title>
          <Card.Text>{this.state.preface}</Card.Text>
          <footer className="text-muted text-right">
            <i>{upd}</i>
          </footer>
        </Card.Body>
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

export default NodeSmallCard;
