import React from "react";

import { Container, InputGroup, FormControl, Button } from "react-bootstrap";
import queryString from "query-string";
import { withRouter } from "react-router-dom";

import "./TopToolBar.css";

class TopToolBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: this.props.value,
      callback: this.props.callback,
    };
    this.searchCmd = React.createRef();
  }

  componentDidMount() {
    if (this.props.inFocus) {
      this.searchCmd.current.focus();
    }
  }

  handleChange = (event) => {
    this.setState({ value: event.target.value });
    if (this.state.callback !== null) {
      this.state.callback(event.target.value);
    } else {
      this.props.history.push({
        pathname: "/search",
        search: queryString.stringify({ q: event.target.value }),
      });
    }
  };

  render() {
    // <InputGroup.Prepend>
    //   <InputGroup.Text className="meta-toptoolbar-prepend">
    //     <span role="img" aria-label="Search">
    //       &#x1F50D;
    //     </span>
    //   </InputGroup.Text>
    // </InputGroup.Prepend>
    return (
      <Container className="meta-top-sticky mt-2 mb-2">
        <InputGroup className="mb-3 mt-0" size="sm">
          <FormControl
            aria-label="Search"
            placeholder="&#x1F50D;"
            onChange={this.handleChange}
            value={this.state.value}
            className="meta-toptoolbar-input"
            ref={this.searchCmd}
          />
        </InputGroup>
      </Container>
    );
  }
}

TopToolBar.defaultProps = {
  callback: null,
  value: "",
};

export default withRouter(TopToolBar);
