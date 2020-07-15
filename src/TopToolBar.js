import React from "react";

import PropTypes from "prop-types";
import queryString from "query-string";
import { Container, InputGroup, FormControl } from "react-bootstrap";
import { withRouter } from "react-router-dom";

import "./TopToolBar.css";

class TopToolBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: this.props.value,
    };
    this.searchInputRef = React.createRef();
  }

  static propTypes = {
    history: PropTypes.object.isRequired,
  };

  componentDidMount() {
    if (this.props.inFocus) {
      this.searchInputRef.current.focus();
    }
  }

  handleChange = (event) => {
    this.setState({ value: event.target.value });
    if (this.props.callback !== null) {
      this.props.callback(event.target.value);
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
            ref={this.searchInputRef}
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
