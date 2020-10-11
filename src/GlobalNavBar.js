import React from "react";

// React router
import { Link, useLocation } from "react-router-dom";

import {
  Form,
  NavDropdown,
  Navbar,
  ButtonGroup,
  Button,
  Dropdown,
  Image,
} from "react-bootstrap";

import PropTypes from "prop-types";
import axios from "axios";
import queryString from "query-string";
import { withRouter } from "react-router-dom";

import user_default_pic from "./user-default-pic.png";

class SearchInputImpl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: this.props.from,
    };
    this.searchCmd = React.createRef();
  }

  static propTypes = {
    history: PropTypes.object.isRequired,
  };

  componentDidMount() {
    if (this.props.inFocus) {
      this.searchCmd.current.focus();
    }
  }

  handleChange = (event) => {
    const value = event.target.value;
    const result_fetch_cancel_id =
      value === "" || value.length > 2
        ? setTimeout(() => {
            this.props.history.push({
              pathname: "/search",
              search: queryString.stringify({ q: value }),
            });
          }, 250)
        : null;
    this.setState((state) => {
      if (state.result_fetch_cancel_id) {
        clearTimeout(state.result_fetch_cancel_id);
      }
      return {
        value: value,
        // Preserve postponed fetch to be able to cancel it
        result_fetch_cancel_id: result_fetch_cancel_id,
      };
    });
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
      <div className="d-inline-flex">
        <Image
          src={user_default_pic}
          roundedCircle
          width="24"
          height="24"
          className="mr-1"
        />
        <div className="d-none d-sm-none d-md-block">
          &nbsp;
          {this.state.name}
        </div>
      </div>
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
      <Navbar.Brand as={Link} to="/" className="d-inline-flex ml-1 mr-2">
        <span role="img" aria-label="next">
          &#x1F9F5;
        </span>
        <div className="d-none d-sm-none d-md-block"> Mazed </div>
      </Navbar.Brand>
      <SearchInput className="ml-auto" from={q} />
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
        className="ml-auto userpic-dropdown mr-1"
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
