import React from "react";

import styles from "./GlobalNavBar.module.css";

// React router
import { Link, useLocation } from "react-router-dom";

import {
  Button,
  ButtonGroup,
  ButtonToolbar,
  Dropdown,
  Form,
  NavDropdown,
  Navbar,
} from "react-bootstrap";

import PropTypes from "prop-types";
import axios from "axios";
import queryString from "query-string";
import { withRouter } from "react-router-dom";

import { MzdGlobalContext } from "./../lib/global";

import { smugler } from "./../smugler/api";

import { HoverTooltip } from "./../lib/tooltip";

import { joinClasses } from "../util/elClass.js";

import kUserDefaultPic from "./../auth/img/user-default-pic.png";

import NewImg from "./../img/new-button.png";
import UploadImg from "./../img/upload.png";

class SearchFormImpl extends React.Component {
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
      <Form onSubmit={this.handleSumbit} className={this.props.className}>
        <Form.Control
          aria-label="Search"
          onChange={this.handleChange}
          value={this.state.value}
          ref={this.searchCmd}
          placeholder="🔎  search"
          className={styles.search_input}
        />
      </Form>
    );
  }
}

SearchFormImpl.defaultProps = {
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
      <div className={joinClasses(styles.user_pic, "d-inline-flex")}>
        <img src={kUserDefaultPic} className={styles.user_pic_image} />
        <div className="d-none d-sm-none d-md-block">
          &nbsp;
          {this.state.name}
        </div>
      </div>
    );
  }
}

const SearchForm = withRouter(SearchFormImpl);

class GlobalNavBar extends React.Component {
  constructor(props) {
    super(props);
    this.fetchCancelToken = axios.CancelToken.source();
  }

  static propTypes = {
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
  };

  handleNewClick = (event) => {
    smugler.node
      .create({
        doc: null,
        cancelToken: this.fetchCancelToken.token,
      })
      .then((node) => {
        if (node) {
          const new_nid = node.nid;
          this.props.history.push("/node/" + new_nid, { edit: true });
        }
      });
  };

  getAuxGroup = () => {
    const aux = this.context.topbar.aux;
    return aux;
  };

  render() {
    const location = this.props.location;
    const params = queryString.parse(location.search);
    var q = params["q"];
    if (!q) {
      q = "";
    }
    const userpic = <UserPic />;
    // <ButtonGroup >
    // </ ButtonGroup >
    return (
      <>
        <Navbar className={styles.navbar}>
          <Navbar.Brand as={Link} to="/" className={joinClasses(styles.brand)}>
            <span role="img" aria-label="next">
              &#x1F9F5;
            </span>
            <div className="d-none d-sm-none d-md-block"> Mazed </div>
          </Navbar.Brand>
          <SearchForm from={q} className={styles.search_form} />

          <ButtonToolbar className={styles.creation_toolbar}>
            <Button
              variant="light"
              as={Link}
              to="/upload-file"
              className={styles.new_btn}
            >
              <HoverTooltip tooltip={"Upload files"}>
                <img
                  src={UploadImg}
                  className={styles.new_btn_img}
                  alt="New note"
                />
              </HoverTooltip>
            </Button>
            <Button
              variant="light"
              onClick={this.handleNewClick}
              className={styles.new_btn}
            >
              <HoverTooltip tooltip={"New note"}>
                <img
                  src={NewImg}
                  className={styles.new_btn_img}
                  alt="New note"
                />
              </HoverTooltip>
            </Button>
          </ButtonToolbar>
          <ButtonToolbar className={styles.creation_toolbar}>
            {this.getAuxGroup()}
          </ButtonToolbar>
          <NavDropdown
            title={userpic}
            id="account-nav-dropdown"
            className={this.account_toolbar}
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
        <div className={styles.navbar_filler} />
      </>
    );
  }
}

GlobalNavBar.contextType = MzdGlobalContext;

export default withRouter(GlobalNavBar);
