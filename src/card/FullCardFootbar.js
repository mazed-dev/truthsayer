import React from "react";

import { Link, withRouter } from "react-router-dom";
import {
  Button,
  Container,
  Form,
  ButtonToolbar,
  ButtonGroup,
  DropdownButton,
  Dropdown,
} from "react-bootstrap";

import PropTypes from "prop-types";

import { smugler } from "./../smugler/api";

import styles from "./FullCardFootbar.module.css";

import DownloadImg from "./../img/download.png";
import CopyImg from "./../img/copy.png";
import SearchImg from "./../img/search.png";
import ArchiveImg from "./../img/archive.png";

import NextNewLeftImg from "./../img/next-link-left-00001.png";
import NextNewRightImg from "./../img/next-link-right-00001.png";

import { MzdToasterContext } from "../lib/toaster";
import { AutocompleteWindow } from "../smartpoint/AutocompleteWindow";
import { HoverTooltip } from "../lib/tooltip";
import { joinClasses } from "../util/elClass.js";
import { markAsACopy } from "../doc/doc_util.jsx";
import { downloadAsFile } from "../util/download_as_file.jsx";

class LeftSearchModal extends React.Component {
  constructor(props) {
    super(props);
  }

  handleReplaceSmartpoint = ({ replacement, nid, edge }) => {
    this.props.addRef({ edge: edge, left: true });
  };

  render() {
    return (
      <>
        <AutocompleteWindow
          show={this.props.show}
          onHide={this.props.onHide}
          on_insert={this.handleReplaceSmartpoint}
          nid={this.props.nid}
          account={this.props.account}
        />
      </>
    );
  }
}

class RightSearchModal extends React.Component {
  constructor(props) {
    super(props);
  }

  handleReplaceSmartpoint = ({ replacement, nid, edge }) => {
    this.props.addRef({ edge: edge, right: true });
  };

  render() {
    return (
      <AutocompleteWindow
        show={this.props.show}
        onHide={this.props.onHide}
        on_insert={this.handleReplaceSmartpoint}
        nid={this.props.nid}
        account={this.props.account}
      />
    );
  }
}

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
  return smugler.edge
    .createFew({
      edges: edges,
      cancelToken: cancelToken,
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

export class FullCardFootbarImpl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modalLeftShow: false,
      modalRightShow: false,
    };
    this.remoteCancelToken = smugler.makeCancelToken();
  }

  static propTypes = {
    history: PropTypes.object.isRequired,
  };

  handleNextRight = (event) => {
    console.log("handleNextRight");
    smugler.node
      .create({
        cancelToken: this.remoteCancelToken.token,
        from_nid: this.props.nid,
      })
      .then((node) => {
        if (node) {
          const new_nid = node.nid;
          __addStickyEdges(
            this.props.stickyEdges,
            new_nid,
            this.props.nid,
            this.remoteCancelToken.token
          ).then(() => {
            this.props.history.push("/node/" + new_nid);
          });
        }
      });
  };

  handleNextRightClone = (event) => {
    cloneNode(
      this.props.nid,
      null,
      this.props.account.getLocalCrypto(),
      this.remoteCancelToken.token
    ).then((node) => {
      if (node) {
        const nid = node.nid;
        this.props.history.push("/node/" + nid);
      }
    });
  };

  handleNextLeft = (event) => {
    smugler.node
      .create({
        cancelToken: this.remoteCancelToken.token,
        to_nid: this.props.nid,
      })
      .then((node) => {
        if (node) {
          const new_nid = node.nid;
          __addStickyEdges(
            this.props.stickyEdges,
            new_nid,
            this.props.nid,
            this.remoteCancelToken.token
          ).then(() => {
            this.props.history.push("/node/" + new_nid);
          });
        }
      });
  };

  handleNextLeftClone = () => {
    cloneNode(
      null,
      this.props.nid,
      this.props.account.getLocalCrypto(),
      this.remoteCancelToken.token
    ).then((node) => {
      if (node) {
        const nid = node.nid;
        this.props.history.push("/node/" + nid);
      }
    });
  };

  handleNextLeftSearch = (event) => {
    this.setState({ modalLeftShow: true });
  };

  handleNextRightSearch = (event) => {
    this.setState({ modalRightShow: true });
  };

  hideRightSearchDialog = (event) => {
    this.setState({ modalRightShow: false });
  };

  hideLeftSearchDialog = (event) => {
    this.setState({ modalLeftShow: false });
  };

  handleCopyMarkdown = () => {
    let toaster = this.context;
    const md = this.props.getMarkdown();
    navigator.clipboard.writeText(md).then(
      function () {
        /* clipboard successfully set */
        toaster.push({
          title: "Copied",
          message: "Note copied to clipboard as markdown",
        });
      },
      function () {
        /* clipboard write failed */
        toaster.push({
          title: "Error",
          message: "Write to system clipboard failed",
        });
      }
    );
  };

  handleDownloadMarkdown = () => {
    const md = this.props.getMarkdown();
    downloadAsFile(this.props.nid + ".txt", md);
  };

  handleArchiveDoc = () => {
    let toaster = this.context;
    toaster.push({
      title: "Not yet implemented",
      message: "Archive feature is not yet implemented",
    });
  };

  render() {
    return (
      <>
        <ButtonToolbar className={joinClasses(styles.toolbar)}>
          <Dropdown
            as={ButtonGroup}
            className={joinClasses(styles.toolbar_layout_item)}
          >
            <Button
              variant="light"
              className={joinClasses(styles.tool_button)}
              onClick={this.handleNextLeft}
            >
              <HoverTooltip tooltip={"Create and link"}>
                <img
                  src={NextNewLeftImg}
                  className={styles.tool_button_img}
                  alt="Add left link"
                />
              </HoverTooltip>
            </Button>

            <Dropdown.Toggle
              split
              variant="light"
              className={joinClasses(styles.tool_button, styles.tool_dropdown)}
            />

            <Dropdown.Menu>
              <Dropdown.Item
                className={styles.dropdown_menu_item}
                onClick={this.handleNextLeftClone}
              >
                <img
                  src={CopyImg}
                  className={styles.dropdown_menu_inline_img}
                  alt="Copy and link"
                />
                Copy and link
              </Dropdown.Item>
              <Dropdown.Item
                className={styles.dropdown_menu_item}
                onClick={this.handleNextLeftSearch}
              >
                <img
                  src={SearchImg}
                  className={styles.dropdown_menu_inline_img}
                  alt="Search and link"
                />
                Search and link
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          <Dropdown
            as={ButtonGroup}
            className={joinClasses(styles.toolbar_layout_item)}
          >
            <Button
              variant="light"
              className={joinClasses(styles.tool_button)}
              onClick={this.handleCopyMarkdown}
            >
              <HoverTooltip tooltip={"Copy as markdown"}>
                <img
                  src={DownloadImg}
                  className={styles.tool_button_img}
                  alt={"Download"}
                />
              </HoverTooltip>
            </Button>

            <Dropdown.Toggle
              split
              variant="light"
              className={joinClasses(styles.tool_button, styles.tool_dropdown)}
            />

            <Dropdown.Menu>
              <Dropdown.Item
                className={styles.dropdown_menu_item}
                onClick={this.handleCopyMarkdown}
              >
                <img
                  src={CopyImg}
                  className={styles.dropdown_menu_inline_img}
                  alt="Copy as markdown"
                />
                Copy as markdown
              </Dropdown.Item>
              <Dropdown.Item
                className={styles.dropdown_menu_item}
                onClick={this.handleDownloadMarkdown}
              >
                <img
                  src={DownloadImg}
                  className={styles.dropdown_menu_inline_img}
                  alt="Download as text"
                />
                Download as text
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          <Button
            variant="light"
            className={joinClasses(
              styles.toolbar_layout_item,
              styles.tool_button
            )}
            onClick={this.handleArchiveDoc}
          >
            <HoverTooltip tooltip={"Archive"}>
              <img
                src={ArchiveImg}
                className={styles.tool_button_img}
                alt={"Archive"}
              />
            </HoverTooltip>
          </Button>

          <Dropdown
            as={ButtonGroup}
            className={joinClasses(styles.toolbar_layout_item)}
          >
            <Dropdown.Toggle
              split
              variant="light"
              className={joinClasses(styles.tool_button, styles.tool_dropdown)}
            />

            <Dropdown.Menu>
              <Dropdown.Item
                className={styles.dropdown_menu_item}
                onClick={this.handleNextRightClone}
              >
                <img
                  src={CopyImg}
                  className={styles.dropdown_menu_inline_img}
                  alt="Copy and link"
                />
                Copy and link
              </Dropdown.Item>
              <Dropdown.Item
                className={styles.dropdown_menu_item}
                onClick={this.handleNextRightSearch}
              >
                <img
                  src={SearchImg}
                  className={styles.dropdown_menu_inline_img}
                  alt="Search and link"
                />
                Search and link
              </Dropdown.Item>
            </Dropdown.Menu>

            <Button
              variant="light"
              className={joinClasses(styles.tool_button)}
              onClick={this.handleNextRight}
            >
              <HoverTooltip tooltip={"Create and link"}>
                <img
                  src={NextNewRightImg}
                  className={styles.tool_button_img}
                  alt="Add right link"
                />
              </HoverTooltip>
            </Button>
          </Dropdown>
        </ButtonToolbar>

        <LeftSearchModal
          addRef={this.props.addRef}
          nid={this.props.nid}
          account={this.props.account}
          show={this.state.modalLeftShow}
          onHide={this.hideLeftSearchDialog}
        />
        <RightSearchModal
          addRef={this.props.addRef}
          nid={this.props.nid}
          account={this.props.account}
          show={this.state.modalRightShow}
          onHide={this.hideRightSearchDialog}
        />
      </>
    );
  }
}

FullCardFootbarImpl.contextType = MzdToasterContext;

export const FullCardFootbar = withRouter(FullCardFootbarImpl);
