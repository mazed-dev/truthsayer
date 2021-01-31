import React from "react";

import styles from "./ToolBars.module.css";

import NextNewLeftImg from "./img/next-link-new-left.png";
import NextNewRightImg from "./img/next-link-new-right.png";

import NextSearchLeftImg from "./img/next-link-search-left.png";
import NextSearchRightImg from "./img/next-link-search-right.png";

import NextCloneLeftImg from "./img/next-link-clone-left.png";
import NextCloneRightImg from "./img/next-link-clone-right.png";

// import NextLeftImg from "./img/next-link-left.png";
// import NextRightImg from "./img/next-link-right.png";

import DropdownArrowOpenedImg from "./img/dropdown-arrow-opened.png";
import DropdownArrowClosedImg from "./img/dropdown-arrow-closed.png";

import { MdSmallCardRender } from "./../markdown/MarkdownRender";

import AutocompleteWindow from "./../smartpoint/AutocompleteWindow";

import { HoverTooltip } from "./../lib/tooltip";

import { markAsACopy } from "../doc/doc_util.jsx";

import { joinClasses } from "../util/elClass.js";

import { smugler } from "./../smugler/api";

import { Button, ButtonGroup, ButtonToolbar } from "react-bootstrap";

import axios from "axios";
import keycode from "keycode";
import moment from "moment";

import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";

class MoreOptionsToConnect extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      opened: false,
    };
  }

  getDropdownImg() {
    if (this.state.opened) {
      return DropdownArrowOpenedImg;
    }
    return DropdownArrowClosedImg;
  }

  getSearchImg() {
    if ("left" in this.props) {
      return NextSearchLeftImg;
    } else {
      return NextSearchRightImg;
    }
  }

  getCloneImg() {
    if ("left" in this.props) {
      return NextCloneLeftImg;
    } else {
      return NextCloneRightImg;
    }
  }

  toggleDropdown = () => {
    this.setState((state) => {
      return {
        opened: !state.opened,
      };
    });
  };

  render() {
    const toggleTooltip = this.state.opened
      ? "Hide link options"
      : "Show link options";
    const toggle = (
      <Button
        variant="light"
        className={joinClasses(
          styles.toolbar_btn,
          styles.toolbar_dropdown_toggle
        )}
        onClick={this.toggleDropdown}
      >
        <HoverTooltip tooltip={toggleTooltip}>
          <img
            src={this.getDropdownImg()}
            className={styles.toolbar_btn_img}
            alt={toggleTooltip}
          />
        </HoverTooltip>
      </Button>
    );
    const others = this.state.opened ? (
      <>
        <Button
          variant="light"
          onClick={this.props.onCloneClick}
          className={styles.toolbar_btn}
        >
          <HoverTooltip tooltip={"Clone and link"}>
            <img
              src={this.getCloneImg()}
              className={styles.toolbar_btn_img}
              alt="Clone and link"
            />
          </HoverTooltip>
        </Button>
        <Button
          variant="light"
          onClick={this.props.onSearchClick}
          className={styles.toolbar_btn}
        >
          <HoverTooltip tooltip={"Search and link"}>
            <img
              src={this.getSearchImg()}
              className={styles.toolbar_btn_img}
              alt="Search and link"
            />
          </HoverTooltip>
        </Button>
      </>
    ) : null;
    return (
      <>
        {toggle} {others}
      </>
    );
  }
}

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
      .then((node) => {
        if (node) {
          const new_nid = node.nid;
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

  handleNextCloneClick = () => {
    cloneNode(
      null,
      this.props.nid,
      this.props.account.getLocalCrypto(),
      this.fetchCancelToken.token
    ).then((node) => {
      if (node) {
        const nid = node.nid;
        this.props.history.push("/node/" + nid);
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
              <HoverTooltip tooltip={"Create and link"}>
                <img
                  src={NextNewLeftImg}
                  className={styles.toolbar_btn_img}
                  alt="Create and link"
                />
              </HoverTooltip>
            </Button>

            <MoreOptionsToConnect
              left
              onSearchClick={this.handleNextSearchClick}
              onCloneClick={this.handleNextCloneClick}
            />
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
      .then((node) => {
        if (node) {
          const new_nid = node.nid;
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

  handleNextCloneClick = (event) => {
    cloneNode(
      this.props.nid,
      null,
      this.props.account.getLocalCrypto(),
      this.fetchCancelToken.token
    ).then((node) => {
      if (node) {
        const nid = node.nid;
        this.props.history.push("/node/" + nid);
      }
    });
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
    // <Button
    //   variant="light"
    //   onClick={this.handleNextSearchClick}
    //   className={styles.toolbar_btn}
    // >
    //   <img
    //     src={NextSearchRightImg}
    //     className={styles.toolbar_btn_img}
    //     alt="Search to connect"
    //   />
    // </Button>
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
              <HoverTooltip tooltip={"Create and link"}>
                <img
                  src={NextNewRightImg}
                  className={styles.toolbar_btn_img}
                  alt="Create and link"
                />
              </HoverTooltip>
            </Button>

            <MoreOptionsToConnect
              right
              onSearchClick={this.handleNextSearchClick}
              onCloneClick={this.handleNextCloneClick}
            />
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

async function cloneNode(from_nid, to_nid, crypto, cancelToken) {
  const nid = from_nid ? from_nid : to_nid;
  const node = await smugler.node.get({
    nid: nid,
    crypto: crypto,
    cancelToken: cancelToken,
  });
  const doc = markAsACopy(node.doc, nid);
  return await smugler.node.create({
    doc: doc,
    cancelToken: cancelToken,
    from_nid: from_nid,
    to_nid: to_nid,
  });
}

export default RightToolBar;
