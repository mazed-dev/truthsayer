import React from "react";

// React router
import {
  BrowserRouter as Router,
  Link,
  Redirect,
  Route,
  Switch,
  useLocation,
  useParams,
} from "react-router-dom";

import "./App.css";

import {
  Button,
  ButtonGroup,
  Card,
  Container,
  Form,
  FormControl,
  ListGroup,
  Nav,
  Navbar,
} from "react-bootstrap";

import queryString from "query-string";

class SearchInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: this.props.value,
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
    if (event.target.value.length > 2) {
      this.props.history.push({
        pathname: "/search",
        search: queryString.stringify({ q: eventq.target.value }),
      });
    }
  };

  render() {
    return (
      <Form inline>
        <Form.Control
          aria-label="Search"
          onChange={this.handleChange}
          value={this.state.value}
          ref={this.searchCmd}
          size="sm"
          placeholder="search"
        />
      </Form>
    );
  }
}

SearchInput.defaultProps = {
  callback: null,
  value: "",
};

function GlobalNavBar() {
        // <Nav.Link as={Link} to="/">search</Nav.Link>
        // <Nav.Link as={Link} to="/node/id">node</Nav.Link>
  return (
    <Navbar bg="light" variant="light" size="sm" className="pt-0 pb-1">
      <Navbar.Brand as={Link} to="/">Mazer</Navbar.Brand>
      <Nav>
        <Nav.Link as={Link} to="/node/--new--">new</Nav.Link>
        <Nav.Link as={Link} to="/thread">thread</Nav.Link>
      </Nav>
      <SearchInput  className="ml-auto"/>
      <Nav className="ml-auto">
        <Nav.Link as={Link} to="/about">about</Nav.Link>
        <Nav.Link as={Link} to="/account">account</Nav.Link>
        <Nav.Link as={Link} to="/login">login</Nav.Link>
        <Nav.Link as={Link} to="/logout">logout</Nav.Link>
        <Nav.Link as={Link} to="/signin">Signin</Nav.Link>
      </Nav>
    </Navbar>
  );
}
      // <Form inline>
      //   <Form.Control type="text" placeholder="Search" size="sm" className="mr-sm-2" />
      // </Form>

export default withRouter(GlobalNavBar);
