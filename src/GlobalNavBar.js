import React from "react";

// React router
import { Link, useLocation } from "react-router-dom";

import { Form, Nav, NavDropdown, Navbar } from "react-bootstrap";

import queryString from "query-string";
import { withRouter } from "react-router-dom";

class SearchInputImpl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: this.props.from,
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
        search: queryString.stringify({ q: event.target.value }),
      });
    }
  };

  handleSumbit = (event) => {
    event.preventDefault();
    this.props.history.push({
      pathname: "/search",
      search: queryString.stringify({ q: this.state.value }),
    });
  };

  render() {
    return (
      <Form inline onSubmit={this.handleSumbit}>
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

SearchInputImpl.defaultProps = {
  callback: null,
  from: "",
};

const SearchInput = withRouter(SearchInputImpl);

function GlobalNavBar() {
  const location = useLocation();
  const params = queryString.parse(location.search);
  var q = params["q"];
  if (!q) {
    q = "";
  }
  return (
    <Navbar bg="light" variant="light" size="sm" className="pt-0 pb-1">
      <Navbar.Brand as={Link} to="/">
        Knotledge
      </Navbar.Brand>
      <SearchInput className="ml-auto" from={q} />
      <Nav>
        <Nav.Link as={Link} to="/node/.new">
          new
          <span role="img" aria-label="next">
            &#x2192;
          </span>
        </Nav.Link>
      </Nav>
      <NavDropdown
        title="&#9881; john@abc"
        id="account-nav-dropdown"
        className="ml-auto"
      >
        <NavDropdown.Item as={Link} to="/account">
          Manage your account
        </NavDropdown.Item>
        <NavDropdown.Item as={Link} to="/setting">
          Settings
        </NavDropdown.Item>
        <NavDropdown.Divider />
        <NavDropdown.Item as={Link} to="/about">
          About knotledge
        </NavDropdown.Item>
        <NavDropdown.Item as={Link} to="/privacy-policy">
          Privacy Policy
        </NavDropdown.Item>
        <NavDropdown.Item as={Link} to="/terms-of-service">
          Terms of Service
        </NavDropdown.Item>
        <NavDropdown.Divider />
        <NavDropdown.Item as={Link} to="/logout">
          log out
        </NavDropdown.Item>
      </NavDropdown>
    </Navbar>
  );
}

export default withRouter(GlobalNavBar);
