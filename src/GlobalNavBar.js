import React from "react";

// React router
import { Link, useLocation } from "react-router-dom";

import {
  Card,
  Form,
  Nav,
  NavDropdown,
  Navbar,
  ButtonGroup,
  Button,
  Dropdown,
  SplitButton,
  Image,
} from "react-bootstrap";

import axios from "axios";
import queryString from "query-string";
import { withRouter } from "react-router-dom";

import Emoji from "./Emoji";

import user_default_pic from "./user-default-pic.png";

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

class UserPic extends React.Component {
  // pub struct AccountInfo<'a> {
  //     pub uid: &'a str,
  //     pub name: &'a str,
  //     pub email: &'a str,
  // }
  constructor(props) {
    super(props);
    this.axiosCancelToken = axios.CancelToken.source();
    this.state = {
      name: "user",
      email: "email",
    };
  }

  componentDidMount() {
    axios
      .get("/api/auth", {
        cancelToken: this.axiosCancelToken.token,
      })
      .then((res) => {
        if (res) {
          this.setState({
            name: res.data.name,
            email: res.data.email,
          });
        }
      });
  }

  componentWillUnmount() {
    this.axiosCancelToken.cancel();
  }

  render() {
    // TODO: use custom user uploaded picture for userpic here
    return (
      <span>
        <Image
          src={user_default_pic}
          roundedCircle
          fluid
          width="18"
          height="18"
          className="mx-2"
        />
        &nbsp;
        {this.state.name}
      </span>
    );
  }
}

const SearchInput = withRouter(SearchInputImpl);

function GlobalNavBar() {
  const location = useLocation();
  const params = queryString.parse(location.search);
  var q = params["q"];
  if (!q) {
    q = "";
  }
  const userpic = <UserPic />;
  return (
    <Navbar bg="light" variant="light" size="sm" className="py-1">
      <Navbar.Brand as={Link} to="/" className="px-4">
        <span role="img" aria-label="next">
          &#x1F9F5;
        </span>
        &nbsp; Mazed
      </Navbar.Brand>
      <SearchInput className="ml-auto px-4" from={q} />
      <Dropdown as={ButtonGroup} size="sm" className="px-2">
        <Button variant="outline-success" as={Link} to="/node/.new">
          add
        </Button>
        <Dropdown.Toggle
          split
          variant="outline-success"
          id="dropdown-custom-2"
        />
        <Dropdown.Menu className="super-colors">
          <Dropdown.Item eventKey="1" as={Link} to="/upload-file">
            Upload from file
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
      <NavDropdown
        title={userpic}
        id="account-nav-dropdown"
        className="ml-auto userpic-dropdown px-4 mx-4"
      >
        <NavDropdown.Item as={Link} to="/user-preferences">
          Manage your account
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
