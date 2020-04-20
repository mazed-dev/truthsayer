import React from "react";

import NodeSmallCard from "./NodeSmallCard";

import { Container, CardColumns } from "react-bootstrap";

class SearchView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: "",
    };
  }

  handleChange = (event) => {
    this.setState({ value: event.target.value });
  };

  render() {
    return (
      <Container>
        <CardColumns>
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
          <NodeSmallCard />
        </CardColumns>
      </Container>
    );
  }
}
export default SearchView;
