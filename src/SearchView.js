import React from "react";

import NodeSmallCard from "./NodeSmallCard";

import {
  Card,
  Button,
  Container,
  CardColumns,
  InputGroup,
  FormControl,
} from "react-bootstrap";

class SearchView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: "",
    }
  }

  handleChange = (event) => {
    this.setState({ value: event.target.value });
  };

  render() {
    return (
      <Container>
        <InputGroup className="mb-3 mt-0">
          <InputGroup.Prepend>
            <InputGroup.Text>&#x1F50D;</InputGroup.Text>
          </InputGroup.Prepend>
          <FormControl
            aria-label="Search"
            placeholder="Search"
            onChange={this.handleChange}
            value={this.state.value}
          />
        </InputGroup>
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
        </CardColumns>
      </Container>
    );
  }
}
export default SearchView;
