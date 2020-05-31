import React from "react";

// React router
import { Link, useLocation } from "react-router-dom";

import {
  Form,
  Nav,
  NavDropdown,
  Navbar,
  ButtonGroup,
  Button,
  Dropdown,
  SplitButton,
} from "react-bootstrap";

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
  // title="&#x27C7;"
  // <Nav.Link as={Link} to="/node/.new">
  //   new
  //   <span role="img" aria-label="next">
  //     &#x2192;
  //   </span>
  // </Nav.Link>
  // <NavDropdown
  //   id="account-nav-dropdown"
  //   className="ml-auto"
  //   toggle
  // >
  //   <NavDropdown.Item as={Link} to="/account">
  //     Manage your account
  //   </NavDropdown.Item>
  // </NavDropdown>
  // <SplitButton
  //   title="new"
  //   id="new-note-nav-dropdown"
  //   size="sm"
  //   variant="light"
  //   as={Link}
  //   to="/node/.new"
  // >
  //   <NavDropdown.Item as={Link} to="/upload-file">
  //     Upload file
  //   </NavDropdown.Item>
  // </SplitButton>
  return (
    <Navbar bg="light" variant="light" size="sm" className="pt-0 pb-1">
      <Navbar.Brand as={Link} to="/">
        <span role="img" aria-label="next">
          &#x1F9F5;
        </span>
        Knitext
      </Navbar.Brand>
      <SearchInput className="ml-auto" from={q} />
      <Dropdown as={ButtonGroup} size="sm">
        <Button variant="secondary" as={Link} to="/node/.new">
          new
        </Button>
        <Dropdown.Toggle split variant="secondary" id="dropdown-custom-2" />
        <Dropdown.Menu className="super-colors">
          <Dropdown.Item eventKey="1" as={Link} to="/upload-file">
            Upload file
          </Dropdown.Item>
          <Dropdown.Divider />
          <Dropdown.Item eventKey="2">Import from gmail</Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
      <NavDropdown
        title="&#9881; john@abc"
        id="account-nav-dropdown"
        className="ml-auto"
      >
        <NavDropdown.Item as={Link} to="/account">
          Manage your account
        </NavDropdown.Item>
        <NavDropdown.Item as={Link} to="/settings">
          Settings
        </NavDropdown.Item>
        <NavDropdown.Item as={Link} to="/help">
          Help
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
