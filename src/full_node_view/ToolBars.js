import React from "react";

import styles from "./ToolBars.module.css";

import NextNewLeftImg from "./img/next-link-new-left.png";
import NextSearchLeftImg from "./img/next-link-search-left.png";

import NextNewRightImg from "./img/next-link-new-right.png";
import NextSearchRightImg from "./img/next-link-search-right.png";

import NextLeftImg from "./img/next-link-left.png";
import NextRightImg from "./img/next-link-right.png";

import { MdSmallCardRender } from "./../markdown/MarkdownRender";

import AutocompleteWindow from "./../smartpoint/AutocompleteWindow";

import { joinClasses } from "../util/elClass.js";
import { remoteErrorHandler } from "./../remoteErrorHandler";

import { smugler } from "./../smugler/api";

import {
  Button,
  ButtonGroup,
  ButtonToolbar,
  Row,
  Col,
  ListGroup,
  Form,
  Modal,
} from "react-bootstrap";

import axios from "axios";
import keycode from "keycode";
import moment from "moment";

import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";

class LeftToolBarImpl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modalShow: false,
    };
    this.fetchCancelToken = axios.CancelToken.source();
  }

  static propTypes = {
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
  };

  componentWillUnmount() {
    this.fetchCancelToken.cancel();
  }

  handleNextClick = (event) => {
    smugler.node
      .create({
        cancelToken: this.fetchCancelToken.token,
        to_nid: this.props.nid,
      })
      .catch(remoteErrorHandler(this.props.history))
      .then((res) => {
        if (res) {
          const new_nid = res.data.nid;
          __addStickyEdges(
            this.props.sticky_edges,
            new_nid,
            this.props.nid,
            this.fetchCancelToken
          ).then(() => {
            this.props.history.push("/node/" + new_nid);
          });
        }
      });
  };

  handleNextSearchClick = (event) => {
    this.setState({ modalShow: true });
  };

  hideSearchDialog = (event) => {
    this.setState({ modalShow: false });
  };

  handleReplaceSmartpoint = ({ replacement, nid }) => {
    smugler.edge
      .create({
        from: nid,
        to: this.props.nid,
        cancelToken: this.fetchCancelToken.token,
      })
      .then((edge) => {
        if (edge) {
          this.props.addRef(edge);
        }
      });
  };

  render() {
    // <DropdownButton
    //   as={ButtonGroup}
    //   title="H1"
    //   variant="outline-secondary"
    // >
    //   <Dropdown.Item eventKey="1">H1</Dropdown.Item>
    //   <Dropdown.Item eventKey="2">H2</Dropdown.Item>
    //   <Dropdown.Item eventKey="2">H3</Dropdown.Item>
    // </DropdownButton>

    // <Button variant="outline-secondary">C</Button>
    // <Button variant="outline-secondary">D</Button>
    return (
      <>
        <ButtonToolbar
          className={joinClasses(styles.toolbar, styles.toolbar_left)}
        >
          <ButtonGroup vertical className={joinClasses(styles.toolbar_group)}>
            <Button
              variant="light"
              onClick={this.handleNextClick}
              className={styles.toolbar_btn}
            >
              <img
                src={NextNewLeftImg}
                className={styles.toolbar_btn_img}
                alt="Next new"
              />
            </Button>
            <Button
              variant="light"
              onClick={this.handleNextSearchClick}
              className={styles.toolbar_btn}
            >
              <img
                src={NextSearchLeftImg}
                className={styles.toolbar_btn_img}
                alt="Search to connect"
              />
            </Button>
          </ButtonGroup>
        </ButtonToolbar>
        <AutocompleteWindow
          show={this.state.modalShow}
          onHide={this.hideSearchDialog}
          on_insert={this.handleReplaceSmartpoint}
          nid={this.props.nid}
          account={this.props.account}
        />
      </>
    );
  }
}

export const LeftToolBar = withRouter(LeftToolBarImpl);

class RightToolBarImpl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modalShow: false,
    };
    this.fetchCancelToken = axios.CancelToken.source();
  }

  static propTypes = {
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
  };

  componentWillUnmount() {
    this.fetchCancelToken.cancel();
  }

  handleNextClick = (event) => {
    smugler.node
      .create({
        cancelToken: this.fetchCancelToken.token,
        from_nid: this.props.nid,
      })
      .catch(remoteErrorHandler(this.props.history))
      .then((res) => {
        if (res) {
          const new_nid = res.data.nid;
          __addStickyEdges(
            this.props.sticky_edges,
            new_nid,
            this.props.nid,
            this.fetchCancelToken
          ).then(() => {
            this.props.history.push("/node/" + new_nid);
          });
        }
      });
  };

  handleNextSearchClick = (event) => {
    this.setState({ modalShow: true });
  };

  hideSearchDialog = (event) => {
    this.setState({ modalShow: false });
  };

  handleReplaceSmartpoint = ({ replacement, nid }) => {
    smugler.edge
      .create({
        from: this.props.nid,
        to: nid,
        cancelToken: this.fetchCancelToken.token,
      })
      .then((edge) => {
        if (edge) {
          this.props.addRef(edge);
        }
      });
  };

  render() {
    return (
      <>
        <ButtonToolbar
          className={joinClasses(styles.toolbar, styles.toolbar_right)}
        >
          <ButtonGroup vertical className={joinClasses(styles.toolbar_group)}>
            <Button
              variant="light"
              onClick={this.handleNextClick}
              className={styles.toolbar_btn}
            >
              <img
                src={NextNewRightImg}
                className={styles.toolbar_btn_img}
                alt="Next new"
              />
            </Button>
            <Button
              variant="light"
              onClick={this.handleNextSearchClick}
              className={styles.toolbar_btn}
            >
              <img
                src={NextSearchRightImg}
                className={styles.toolbar_btn_img}
                alt="Search to connect"
              />
            </Button>
          </ButtonGroup>
          {this.props.children}
        </ButtonToolbar>
        <AutocompleteWindow
          show={this.state.modalShow}
          onHide={this.hideSearchDialog}
          on_insert={this.handleReplaceSmartpoint}
          nid={this.props.nid}
          account={this.props.account}
        />
      </>
    );
  }
}

export const RightToolBar = withRouter(RightToolBarImpl);

export function _createAddingStickyEdgesRequest(sticky_edges, prev_nid) {
  if (sticky_edges == null) {
    return null;
  }
  const edges = sticky_edges
    .map((se) => {
      if (se.is_sticky) {
        if (se.to_nid === prev_nid) {
          return {
            from_nid: se.from_nid,
            is_sticky: true,
          };
        } else if (se.from_nid === prev_nid) {
          return {
            to_nid: se.to_nid,
            is_sticky: true,
          };
        }
      }
      return null;
    })
    .filter((item) => item != null);

  return edges.length !== 0
    ? {
        edges: edges,
      }
    : null;
}

function __addStickyEdges(sticky_edges, new_nid, prev_nid, cancelToken) {
  if (sticky_edges == null) {
    return Promise.resolve([]);
  }
  const edges = sticky_edges
    .map((se) => {
      if (se.is_sticky) {
        if (se.to_nid === prev_nid) {
          return {
            from_nid: se.from_nid,
            is_sticky: true,
          };
        } else if (se.from_nid === prev_nid) {
          return {
            to_nid: se.to_nid,
            is_sticky: true,
          };
        }
      }
      return null;
    })
    .filter((item) => item != null);
  if (edges.length === 0) {
    return Promise.resolve([]);
  }
  const req = { edges: edges };
  return axios
    .post("/api/node/" + new_nid + "/edge", req, {
      cancelToken: cancelToken.token,
    })
    .then((res) => {
      if (res) {
        return res.data.edges;
      }
    });
}

export default RightToolBar;
