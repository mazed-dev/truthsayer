import React from "react";

import { Container, InputGroup, FormControl } from "react-bootstrap";

import "./TopToolBar.css";

class TopToolBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: this.props.value,
      callback: this.props.callback,
    };
  }

  handleChange = (event) => {
    this.setState({ value: event.target.value });
    this.state.callback(event.target.value);
  };

  render() {
    return (
      <Container className="meta-top-sticky mt-2 mb-2">
        <InputGroup className="mb-3 mt-0" size="sm">
          <InputGroup.Prepend>
            <InputGroup.Text className="meta-toptoolbar-prepend">
              <span role="img" aria-label="Search">
                &#x1F50D;
              </span>
            </InputGroup.Text>
          </InputGroup.Prepend>
          <FormControl
            aria-label="Search"
            placeholder="Search"
            onChange={this.handleChange}
            value={this.state.value}
            className="meta-toptoolbar-input"
          />
        </InputGroup>
      </Container>
    );
  }
}

TopToolBar.defaultProps = {
  callback: (_) => {},
  value: "",
};

export default TopToolBar;
