import React from "react";

import maze from "./maze.png";

import { Card } from "react-bootstrap";

class NodeSmallCard extends React.Component {
  render() {
    return (
      <Card className="rounded">
        <Card.Body className="p-3 m-0">
          <div className="d-flex justify-content-center">
            <Card.Img variant="top" className="w-25 p-0 m-2" src={maze} />
          </div>
          <Card.Title>Card Title</Card.Title>
          <Card.Text>
            Some quick example text to build on the card title and make up the
            bulk of the card's content.
          </Card.Text>
        </Card.Body>
      </Card>
    );
  }
}

export default NodeSmallCard;
