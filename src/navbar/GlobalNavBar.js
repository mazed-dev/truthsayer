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
  Nav,
} from "react-bootstrap";

import PropTypes from "prop-types";
import axios from "axios";
import queryString from "query-string";
import { withRouter } from "react-router-dom";

import { MzdGlobalContext } from "./../lib/global";

import { smugler } from "./../smugler/api";

import { HoverTooltip } from "./../lib/tooltip";
import { goto, anchor } from "./../lib/route.jsx";

import { joinClasses } from "../util/elClass.js";

import kUserDefaultPic from "./../auth/img/user-default-pic.png";

import NewImg from "./../img/new-button.png";
import UploadImg from "./../img/upload.png";

import { SearchForm } from "./SearchForm";

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

class PrivateNavButtonsImpl extends React.Component {
  constructor(props) {
    super(props);
    this.newNodeCancelToken = axios.CancelToken.source();
  }

  static propTypes = {
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
  };

  handleNewClick = (event) => {
    smugler.node
      .create({
        doc: null,
        cancelToken: this.newNodeCancelToken.token,
      })
      .then((node) => {
        if (node) {
          goto.node({ history: this.props.history, nid: node.nid });
        }
      });
  };

  getAuxGroup = () => {
    const aux = this.context.topbar.aux;
    return aux;
  };

  render() {
    const { query } = anchor.search({ location: this.props.location });
    const userpic = <UserPic />;
    return (
      <>
          <SearchForm from={query} className={styles.search_form} />

          <ButtonToolbar className={styles.creation_toolbar}>
            <Button
              variant="light"
              as={Link}
              to="/upload-file"
              className={styles.nav_button}
            >
              <HoverTooltip tooltip={"Upload"}>
                <img
                  src={UploadImg}
                  className={styles.new_btn_img}
                  alt="Upload from file"
                />
              </HoverTooltip>
            </Button>
            <Button
              variant="light"
              onClick={this.handleNewClick}
              className={styles.nav_button}
            >
              <HoverTooltip tooltip={"New"}>
                <img src={NewImg} className={styles.new_btn_img} alt="New" />
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
      </>
    );
  }
}

PrivateNavButtonsImpl.contextType = MzdGlobalContext;
const PrivateNavButtons = withRouter(PrivateNavButtonsImpl);

class PublicNavButtons extends React.Component {
  render() {
    return (<>
      <Navbar.Toggle aria-controls="responsive-public-navbar" />
      <Navbar.Collapse id="responsive-public-navbar">
        <Nav>
          <Nav.Link as={Link} to="/terms-of-service">
            Terms of service
          </Nav.Link>
          <Nav.Link as={Link} to="/privacy-policy">
            Privacy policy
          </Nav.Link>
          <Nav.Link as={Link} to="/contacts">
            Contact us
          </Nav.Link>
        </Nav>
        <Nav className="ml-auto">
          <Nav.Link as={Link} to="/login">
            Log in
          </Nav.Link>
        </Nav>
      </Navbar.Collapse>
      </>);
  }
}

class GlobalNavBar extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let buttons = null;
    let account = this.context.account;
    if (account) {
      buttons = (<PrivateNavButtons />);
    } else {
      buttons = (<PublicNavButtons />);
    }
    return (
      <>
        <Navbar className={styles.navbar}>
          <Navbar.Brand as={Link} to="/" className={joinClasses(styles.brand)}>
            <span role="img" aria-label="next">
              &#x1F9F5;
            </span>
            <div className="d-none d-sm-none d-md-block"> Mazed </div>
          </Navbar.Brand>
          {buttons}
        </Navbar>
        <div className={styles.navbar_filler} />
      </>
    );
  }
}

GlobalNavBar.contextType = MzdGlobalContext;

export default withRouter(GlobalNavBar);
