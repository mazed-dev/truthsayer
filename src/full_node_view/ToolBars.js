import React from "react";

import styles from "./ToolBars.module.css";

import NextNewLeftImg from "./img/next-link-new-left.png";
import NextSearchLeftImg from "./img/next-link-search-left.png";

import NextNewRightImg from "./img/next-link-new-right.png";
import NextSearchRightImg from "./img/next-link-search-right.png";

import NextLeftImg from "./img/next-link-left.png";
import NextRightImg from "./img/next-link-right.png";

import { MdSmallCardRender } from "./../markdown/MarkdownRender";

import { joinClasses } from "../util/elClass.js";
import { remoteErrorHandler } from "./../remoteErrorHandler";

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
import queryString from "query-string";

import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";

export class NextSearchRefItem extends React.Component {
  // Props:
  // - nid
  // - dst_nid

  constructor(props) {
    super(props);
    this.state = {
      added: false,
    };
    this.addNodeRefCancelToken = axios.CancelToken.source();
  }

  componentWillUnmount() {
    this.addNodeRefCancelToken.cancel();
  }

  handleSumbit = () => {
    this.addNodeReference();
  };

  addNodeReference = () => {
    var from_nid;
    var to_nid;
    if (this.props.left) {
      from_nid = this.props.nid;
      to_nid = this.props.dst_nid;
    } else {
      from_nid = this.props.dst_nid;
      to_nid = this.props.nid;
    }
    const edges = [
      {
        from_nid: from_nid,
        to_nid: to_nid,
      },
    ];
    const req = { edges: edges };
    return axios
      .post("/api/node/" + to_nid + "/edge", req, {
        cancelToken: this.addNodeRefCancelToken.token,
      })
      .then((res) => {
        if (res) {
          this.setState({ added: true });
          const edges = res.data.edges;
          if (edges.length === 0) {
            console.log("Error, no edge was created from [next] click");
            return;
          }
          if (edges.length !== 1) {
            console.log(
              "Warning, more than 1 edge were created from [next] click. User first one."
            );
          }
          const edge = edges[0];
          this.props.addRef(edge);
        }
      });
  };

  render() {
    const upd = moment.unix(this.props.upd).fromNow();
    const img = this.props.left ? (
      <img
        src={NextLeftImg}
        className={styles.toolbar_btn_img}
        alt="Add to the left"
      />
    ) : (
      <img
        src={NextRightImg}
        className={styles.toolbar_btn_img}
        alt="Add to the right"
      />
    );
    return (
      <Row className="justify-content-between w-100 p-0 m-0">
        <Col sm md lg xl={10}>
          <MdSmallCardRender source={this.props.preface + " &hellip;"} />
          <small className="text-muted">
            <i>Updated {upd}</i>
          </small>
        </Col>
        <Col sm md lg xl={2}>
          <Button
            variant="outline-secondary"
            onClick={this.handleSumbit}
            disabled={this.state.added}
          >
            {img}
          </Button>
        </Col>
      </Row>
    );
  }
}

class NextSearchModalDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      input: "",
      result: [],
      result_fetch_cancel_id: null,
      cursor: 0,
    };
    this.inputRef = React.createRef();
    this.searchFetchCancelToken = axios.CancelToken.source();
  }

  componentDidMount() {
    this.inputRef.current.focus();
  }

  componentWillUnmount() {
    this.searchFetchCancelToken.cancel();
  }

  refSearch = async function (input) {
    const req = { q: input };
    axios
      .post("/api/node-search", req, {
        cancelToken: this.searchFetchCancelToken.token,
      })
      .then((res) => {
        const items = res.data.nodes.map((meta) => {
          return (
            <NextSearchRefItem
              nid={meta.nid}
              dst_nid={this.props.nid}
              preface={meta.preface}
              upd={meta.upd}
              on_insert={this.props.on_insert}
              ref={React.createRef()}
              left={this.props.left}
              addRef={this.props.addRef}
            />
          );
        });
        this.setState((state) => {
          return {
            result: state.result.concat(items),
          };
        });
      })
      .catch(remoteErrorHandler(this.props.history));
  };

  handleChange = (event) => {
    const value = event.target.value;
    // Hack to avoid fetching on every character. If the time interval between
    // 2 consecutive keystokes is too short, don't fetch results.
    const result_fetch_cancel_id =
      value && value !== ""
        ? setTimeout(() => {
            this.refSearch(value);
          }, 200)
        : null;
    this.setState((state) => {
      if (state.result_fetch_cancel_id) {
        clearTimeout(state.result_fetch_cancel_id);
      }
      return {
        input: value,
        // Clear input
        result: [],
        // Preserve postponed fetch to be able to cancel it
        result_fetch_cancel_id: result_fetch_cancel_id,
      };
    });
  };

  handleSumbit = (event) => {};

  handleKeyDown = (e) => {
    // https://stackoverflow.com/questions/42036865/react-how-to-navigate-through-list-by-arrow-keys
    // arrow up/down button should select next/previous list element
    if (e.keyCode === keycode("up")) {
      e.preventDefault();
      this.setState((state, props) => {
        return { cursor: state.cursor - (state.cursor > 0 ? 1 : 0) };
      });
    } else if (e.keyCode === keycode("down")) {
      e.preventDefault();
      this.setState((state, props) => {
        const maxL = state.result.length > 0 ? state.result.length - 1 : 0;
        return { cursor: state.cursor >= maxL ? maxL : state.cursor + 1 };
      });

      // TODO(akindyakov): Fix it please. Add by enter doesn't work properly
      // because I couldn't "disable" card button from here.
      // -------------------------------------------------------------------------
      // } else if (e.keyCode === keycode("enter") || e.keyCode === keycode("tab")) {
      //   e.preventDefault();
      //   const item = this.state.result[this.state.cursor];
      //   item.ref.current.handleSumbit();
      //   this.props.on_hide();
    }
  };

  setActiveItem = (index) => {
    this.setState({ cursor: index });
  };

  render() {
    const listItems = this.state.result.map((item, index) => {
      return (
        <ListGroup.Item
          as="li"
          active={this.state.cursor === index}
          key={index}
          id={"smartpoint-item=" + index}
          className="p-1"
          onMouseEnter={() => this.setActiveItem(index)}
        >
          {item}
        </ListGroup.Item>
      );
    });
    return (
      <>
        <Form.Control
          aria-label="Search-to-link"
          aria-describedby="basic-addon1"
          onChange={this.handleChange}
          onSubmit={this.handleSumbit}
          onKeyDown={this.handleKeyDown}
          value={this.state.input}
          placeholder="Type something"
          ref={this.inputRef}
        />
        <ListGroup as="ul" className="autocomplete-window-list-group">
          {listItems}
        </ListGroup>
      </>
    );
  }
}

class NextSearchModal extends React.Component {
  render() {
    return (
      <Modal
        show={this.props.show}
        onHide={this.props.onHide}
        size="lg"
        aria-labelledby="contained-modal-next-search"
        centered
        keyboard={true}
        restoreFocus={false}
        animation={false}
        scrollable={true}
        enforceFocus={true}
      >
        <NextSearchModalDialog
          on_insert={this.props.on_insert}
          nid={this.props.nid}
          on_hide={this.props.onHide}
          left={this.props.left}
          addRef={this.props.addRef}
        />
      </Modal>
    );
  }
}

NextSearchModal.defaultProps = {
  left: false,
  right: false,
};

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
    const value = "";
    const config = {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
      cancelToken: this.fetchCancelToken.token,
    };
    const query =
      "?" +
      queryString.stringify({
        to: this.props.nid,
      });
    axios
      .post("/api/node/new" + query, value, config)
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
            this.props.history.push("/node/" + new_nid, { edit: true });
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
        <NextSearchModal
          show={this.state.modalShow}
          onHide={this.hideSearchDialog}
          nid={this.props.nid}
          left={true}
          addRef={this.props.addRef}
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
    const value = "";
    const config = {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
      cancelToken: this.fetchCancelToken.token,
    };
    const query =
      "?" +
      queryString.stringify({
        from: this.props.nid,
      });
    axios
      .post("/api/node/new" + query, value, config)
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
            this.props.history.push("/node/" + new_nid, { edit: true });
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
        <NextSearchModal
          show={this.state.modalShow}
          onHide={this.hideSearchDialog}
          nid={this.props.nid}
          right={true}
          addRef={this.props.addRef}
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
