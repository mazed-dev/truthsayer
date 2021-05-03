import React from "react";

import { withRouter } from "react-router-dom";
import { Button, ButtonToolbar, ButtonGroup, Dropdown } from "react-bootstrap";

import PropTypes from "prop-types";

import { smugler } from "./../smugler/api";

import styles from "./FullCardFootbar.module.css";

import DownloadImg from "./../img/download.png";
import CopyImg from "./../img/copy.png";
import SearchImg from "./../img/search.png";
import ArchiveImg from "./../img/archive.png";
import DeleteImg from "./../img/delete.png";

import NextNewLeftImg from "./../img/next-link-left-00001.png";
import NextNewRightImg from "./../img/next-link-right-00001.png";

import NextCopyLeftImg from "./../img/next-clone-left.png";
import NextCopyRightImg from "./../img/next-clone-right.png";

import EllipsisImg from "./../img/ellipsis.png";

import EncryptedImg from "./../img/encrypted.png";
import PrivateImg from "./../img/private.png";
import PublicImg from "./../img/public.png";

import { ShareModal } from "./ShareModal";

import { MzdGlobalContext } from "../lib/global";
import { AutocompleteWindow } from "../smartpoint/AutocompleteWindow";
import { HoverTooltip } from "../lib/tooltip";
import { ImgButton } from "../lib/ImgButton";
import { goto } from "../lib/route.jsx";
import { joinClasses } from "../util/elClass.js";
import { makeACopy, makeBlankCopy } from "../doc/doc_util.jsx";
import { downloadAsFile } from "../util/download_as_file.jsx";

class LeftSearchModal extends React.Component {
  constructor(props) {
    super(props);
    this.addNodeRefCancelToken = smugler.makeCancelToken();
  }

  handleReplaceSmartpoint = ({ replacement, nid }) => {
    if (nid) {
      smugler.edge
        .create({
          from: nid,
          to: this.props.nid,
          cancelToken: this.addNodeRefCancelToken.token,
        })
        .then((edge) => {
          if (edge) {
            this.props.addRef({ edge: edge, left: true });
          }
        });
    }
  };

  componentWillUnmount() {
    this.addNodeRefCancelToken.cancel();
  }

  render() {
    return (
      <AutocompleteWindow
        show={this.props.show}
        onHide={this.props.onHide}
        on_insert={this.handleReplaceSmartpoint}
        nid={this.props.nid}
        suggestDateTime={false}
      />
    );
  }
}

const CustomMoreToggle = React.forwardRef(({ children, onClick }, ref) => (
  <Button
    variant="light"
    className={joinClasses(styles.tool_button)}
    ref={ref}
    onClick={(e) => {
      e.preventDefault();
      onClick(e);
    }}
  >
    {children}
    <HoverTooltip tooltip={"More"}>
      <img src={EllipsisImg} className={styles.tool_button_img} alt={"More"} />
    </HoverTooltip>
  </Button>
));

const CustomNodePrivacyToggle = React.forwardRef(
  ({ children, onClick }, ref) => (
    <Button
      variant="light"
      className={joinClasses(styles.tool_button)}
      ref={ref}
      onClick={(e) => {
        e.preventDefault();
        onClick(e);
      }}
    >
      {children}
      <HoverTooltip tooltip={"Publicity and encryption"}>
        <img
          src={PrivateImg}
          className={styles.tool_button_img}
          alt={"Publicity and encryption"}
        />
      </HoverTooltip>
    </Button>
  )
);

class RightSearchModal extends React.Component {
  constructor(props) {
    super(props);
    this.addNodeRefCancelToken = smugler.makeCancelToken();
  }

  handleReplaceSmartpoint = ({ replacement, nid }) => {
    if (nid) {
      smugler.edge
        .create({
          from: this.props.nid,
          to: nid,
          cancelToken: this.addNodeRefCancelToken.token,
        })
        .then((edge) => {
          if (edge) {
            this.props.addRef({ edge: edge, right: true });
          }
        });
    }
  };

  componentWillUnmount() {
    this.addNodeRefCancelToken.cancel();
  }

  render() {
    let account = this.context.account;
    return (
      <AutocompleteWindow
        show={this.props.show}
        onHide={this.props.onHide}
        on_insert={this.handleReplaceSmartpoint}
        nid={this.props.nid}
        suggestDateTime={false}
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
            to_nid: new_nid,
            is_sticky: true,
          };
        } else if (se.from_nid === prev_nid) {
          return {
            to_nid: se.to_nid,
            from_nid: new_nid,
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
  return smugler.edge.createFew({
    edges: edges,
    cancelToken: cancelToken,
  });
}

async function cloneNode({ from, to, crypto, cancelToken, blank }) {
  const nid = from ? from : to;
  const node = await smugler.node.get({
    nid: nid,
    crypto: crypto,
    cancelToken: cancelToken,
  });
  let doc = null;
  if (blank) {
    doc = makeBlankCopy(node.doc);
  } else {
    doc = makeACopy(node.doc, nid);
  }
  return await smugler.node.create({
    doc: doc,
    cancelToken: cancelToken,
    from_nid: from,
    to_nid: to,
  });
}

class PrivateFullCardFootbar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modalLeftShow: false,
      modalRightShow: false,
      modalShareShow: false,
    };
    this.createCancelToken = smugler.makeCancelToken();
    this.deleteCancelToken = smugler.makeCancelToken();
  }

  static propTypes = {
    history: PropTypes.object.isRequired,
  };

  handleNextRight = (event) => {
    smugler.node
      .create({
        cancelToken: this.createCancelToken.token,
        from_nid: this.props.nid,
      })
      .then((node) => {
        if (node) {
          const new_nid = node.nid;
          __addStickyEdges(
            this.props.stickyEdges,
            new_nid,
            this.props.nid,
            this.createCancelToken.token
          ).then(() => {
            goto.node({ history: this.props.history, nid: new_nid });
          });
        }
      });
  };

  handleNextRightClone = (event) => {
    let account = this.context.account;
    cloneNode({
      from: this.props.nid,
      to: null,
      crypto: account.getLocalCrypto(),
      cancelToken: this.createCancelToken.token,
    }).then((node) => {
      if (node) {
        goto.node({ history: this.props.history, nid: node.nid });
      }
    });
  };

  handleNextLeftBlankCopy = () => {
    let account = this.context.account;
    cloneNode({
      from: null,
      to: this.props.nid,
      crypto: account.getLocalCrypto(),
      cancelToken: this.createCancelToken.token,
      blank: true,
    }).then((node) => {
      if (node) {
        goto.node({ history: this.props.history, nid: node.nid });
      }
    });
  };

  handleNextRightBlankCopy = () => {
    let account = this.context.account;
    cloneNode({
      from: this.props.nid,
      to: null,
      crypto: account.getLocalCrypto(),
      cancelToken: this.createCancelToken.token,
      blank: true,
    }).then((node) => {
      if (node) {
        goto.node({ history: this.props.history, nid: node.nid });
      }
    });
  };

  handleNextLeft = (event) => {
    smugler.node
      .create({
        cancelToken: this.createCancelToken.token,
        to_nid: this.props.nid,
      })
      .then((node) => {
        if (node) {
          const new_nid = node.nid;
          __addStickyEdges(
            this.props.stickyEdges,
            new_nid,
            this.props.nid,
            this.createCancelToken.token
          ).then(() => {
            goto.node({ history: this.props.history, nid: new_nid });
          });
        }
      });
  };

  handleNextLeftClone = () => {
    let account = this.context.account;
    cloneNode({
      from: null,
      to: this.props.nid,
      crypto: account.getLocalCrypto(),
      cancelToken: this.createCancelToken.token,
    }).then((node) => {
      if (node) {
        goto.node({ history: this.props.history, nid: node.nid });
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

  hideShareDialog = (event) => {
    this.setState({ modalShareShow: false });
  };

  showShareDialog = (event) => {
    this.setState({ modalShareShow: true });
  };

  handleCopyMarkdown = () => {
    let toaster = this.context.toaster;
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
    let toaster = this.context.toaster;
    toaster.push({
      title: "Not yet implemented",
      message: "Archive feature is not yet implemented",
    });
  };

  handleDeleteNote = () => {
    let toaster = this.context.toaster;
    smugler.node
      .delete({
        nid: this.props.nid,
        cancelToken: this.deleteCancelToken.token,
      })
      .then(() => {
        toaster.push({
          title: "Moved to bin",
          message:
            "Notes that have been in the bin for more than 28 days will be deleted automatically",
        });
        goto.default({ history: this.props.history });
      });
  };

  getShareBtn = () => {
    let img_ = PrivateImg;
    let txt_ = "Share";
    if (this.props.meta && this.props.meta) {
      const share = this.props.meta.share;
      if (share && share.by_link) {
        img_ = PublicImg;
      }
      const local_secret_id = this.props.meta.local_secret_id;
      if (local_secret_id) {
        img_ = EncryptedImg;
      }
    }
    return (
      <HoverTooltip tooltip={txt_}>
        <img
          src={img_}
          className={styles.tool_button_img}
          alt={"Publicity and encryption"}
        />
      </HoverTooltip>
    );
  };

  render() {
    return (
      <>
        <ButtonToolbar className={joinClasses(styles.toolbar)}>
          <Dropdown
            as={ButtonGroup}
            className={joinClasses(styles.toolbar_layout_item)}
          >
            <Dropdown.Toggle
              variant="light"
              className={joinClasses(styles.tool_button, styles.tool_dropdown)}
            >
              <HoverTooltip tooltip={"Link to the left"}>
                <img
                  src={NextNewLeftImg}
                  className={styles.tool_button_img}
                  alt="Add left link"
                />
              </HoverTooltip>
            </Dropdown.Toggle>

            <Dropdown.Menu>
              <Dropdown.Item
                className={styles.dropdown_menu_item}
                onClick={this.handleNextLeft}
              >
                <img
                  src={NextNewLeftImg}
                  className={styles.dropdown_menu_inline_img}
                  alt="Add left link"
                />
                New
              </Dropdown.Item>

              <Dropdown.Item
                className={styles.dropdown_menu_item}
                onClick={this.handleNextLeftClone}
              >
                <img
                  src={NextCopyLeftImg}
                  className={styles.dropdown_menu_inline_img}
                  alt="Copy and link"
                />
                Copy
              </Dropdown.Item>
              <Dropdown.Item
                className={styles.dropdown_menu_item}
                onClick={this.handleNextLeftBlankCopy}
              >
                <img
                  src={NextCopyLeftImg}
                  className={styles.dropdown_menu_inline_img}
                  alt="Blank copy and link"
                />
                Blank copy
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
                Search
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          <ImgButton
            onClick={this.showShareDialog}
            className={joinClasses(
              styles.tool_button,
              styles.toolbar_layout_item
            )}
          >
            {this.getShareBtn()}
          </ImgButton>

          <Dropdown className={joinClasses(styles.toolbar_layout_item)}>
            <Dropdown.Toggle
              variant="light"
              className={joinClasses(styles.tool_button, styles.tool_dropdown)}
              id={"more-options-for-fullsize-card"}
              as={CustomMoreToggle}
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

              <Dropdown.Divider />
              <Dropdown.Item
                className={styles.dropdown_menu_item}
                onClick={this.handleDeleteNote}
              >
                <img
                  src={DeleteImg}
                  className={styles.dropdown_menu_inline_img}
                  alt={"Delete"}
                />
                Delete
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item
                className={styles.dropdown_menu_item}
                onClick={this.handleArchiveDoc}
              >
                <img
                  src={ArchiveImg}
                  className={styles.dropdown_menu_inline_img}
                  alt={"Archive"}
                />
                Archive
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          <Dropdown
            as={ButtonGroup}
            className={joinClasses(styles.toolbar_layout_item)}
          >
            <Dropdown.Toggle
              variant="light"
              className={joinClasses(styles.tool_button, styles.tool_dropdown)}
            >
              <HoverTooltip tooltip={"Link to the right"}>
                <img
                  src={NextNewRightImg}
                  className={styles.tool_button_img}
                  alt="Add left link"
                />
              </HoverTooltip>
            </Dropdown.Toggle>

            <Dropdown.Menu>
              <Dropdown.Item
                className={styles.dropdown_menu_item}
                onClick={this.handleNextRight}
              >
                <img
                  src={NextNewRightImg}
                  className={styles.dropdown_menu_inline_img}
                  alt="Add right link"
                />
                New
              </Dropdown.Item>
              <Dropdown.Item
                className={styles.dropdown_menu_item}
                onClick={this.handleNextRightClone}
              >
                <img
                  src={NextCopyRightImg}
                  className={styles.dropdown_menu_inline_img}
                  alt="Copy and link"
                />
                Copy
              </Dropdown.Item>
              <Dropdown.Item
                className={styles.dropdown_menu_item}
                onClick={this.handleNextRightBlankCopy}
              >
                <img
                  src={NextCopyRightImg}
                  className={styles.dropdown_menu_inline_img}
                  alt="Blnak copy and link"
                />
                Blank copy
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
                Search
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </ButtonToolbar>

        <ShareModal
          show={this.state.modalShareShow}
          nid={this.props.nid}
          onHide={this.hideShareDialog}
        />
        <LeftSearchModal
          addRef={this.props.addRef}
          nid={this.props.nid}
          show={this.state.modalLeftShow}
          onHide={this.hideLeftSearchDialog}
        />
        <RightSearchModal
          addRef={this.props.addRef}
          nid={this.props.nid}
          show={this.state.modalRightShow}
          onHide={this.hideRightSearchDialog}
        />
      </>
    );
  }
}

// PrivateFullCardFootbar.contextType = MzdGlobalContext;

PrivateFullCardFootbar = withRouter(PrivateFullCardFootbar);

class PublicFullCardFootbarImpl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.createCancelToken = smugler.makeCancelToken();
  }

  static propTypes = {
    history: PropTypes.object.isRequired,
  };

  getAccountOrLogin = () => {
    let account = this.context.account;
    if (account) {
      return account;
    }
    goto.notice.logInToContinue({ history: this.props.history });
    return null;
  };

  handleNextRight = (event) => {
    const account = this.getAccountOrLogin();
    if (!account) {
      return;
    }
    smugler.node
      .create({
        cancelToken: this.createCancelToken.token,
        from_nid: this.props.nid,
      })
      .then((node) => {
        if (node) {
          const new_nid = node.nid;
          __addStickyEdges(
            this.props.stickyEdges,
            new_nid,
            this.props.nid,
            this.createCancelToken.token
          ).then(() => {
            goto.node({ history: this.props.history, nid: new_nid });
          });
        }
      });
  };

  handleNextRightClone = (event) => {
    const account = this.getAccountOrLogin();
    if (!account) {
      return;
    }
    cloneNode({
      from: this.props.nid,
      to: null,
      crypto: account.getLocalCrypto(),
      cancelToken: this.createCancelToken.token,
    }).then((node) => {
      if (node) {
        goto.node({ history: this.props.history, nid: node.nid });
      }
    });
  };

  handleNextLeft = (event) => {
    const account = this.getAccountOrLogin();
    if (!account) {
      return;
    }
    smugler.node
      .create({
        cancelToken: this.createCancelToken.token,
        to_nid: this.props.nid,
      })
      .then((node) => {
        if (node) {
          const new_nid = node.nid;
          __addStickyEdges(
            this.props.stickyEdges,
            new_nid,
            this.props.nid,
            this.createCancelToken.token
          ).then(() => {
            goto.node({ history: this.props.history, nid: new_nid });
          });
        }
      });
  };

  handleNextLeftClone = () => {
    const account = this.getAccountOrLogin();
    if (!account) {
      return;
    }
    cloneNode({
      from: null,
      to: this.props.nid,
      crypto: account.getLocalCrypto(),
      cancelToken: this.createCancelToken.token,
    }).then((node) => {
      if (node) {
        goto.node({ history: this.props.history, nid: node.nid });
      }
    });
  };

  handleCopyMarkdown = () => {
    let toaster = this.context.toaster;
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
    downloadAsFile(this.props.nid + ".md.txt", md);
  };

  render() {
    return (
      <>
        <ButtonToolbar className={joinClasses(styles.toolbar)}>
          <ImgButton
            onClick={this.handleNextLeft}
            className={joinClasses(
              styles.tool_button,
              styles.toolbar_layout_item
            )}
          >
            <HoverTooltip tooltip={"Link to the left"}>
              <img
                src={NextNewLeftImg}
                className={styles.tool_button_img}
                alt="Add left link"
              />
            </HoverTooltip>
          </ImgButton>

          <ImgButton
            onClick={this.handleNextLeftClone}
            className={joinClasses(
              styles.tool_button,
              styles.toolbar_layout_item
            )}
          >
            <HoverTooltip tooltip={"Copy and link"}>
              <img
                src={NextCopyLeftImg}
                className={styles.tool_button_img}
                alt="Copy and link"
              />
            </HoverTooltip>
          </ImgButton>

          <ImgButton
            onClick={this.handleNextRightClone}
            className={joinClasses(
              styles.tool_button,
              styles.toolbar_layout_item
            )}
          >
            <HoverTooltip tooltip={"Copy and link"}>
              <img
                src={NextCopyRightImg}
                className={styles.tool_button_img}
                alt="Copy and link"
              />
            </HoverTooltip>
          </ImgButton>

          <ImgButton
            onClick={this.handleNextRight}
            className={joinClasses(
              styles.tool_button,
              styles.toolbar_layout_item
            )}
          >
            <HoverTooltip tooltip={"Link to the right"}>
              <img
                src={NextNewRightImg}
                className={styles.tool_button_img}
                alt="Add right link"
              />
            </HoverTooltip>
          </ImgButton>
        </ButtonToolbar>
      </>
    );
  }
}

// PublicFullCardFootbarImpl.contextType = MzdGlobalContext;

const PublicFullCardFootbar = withRouter(PublicFullCardFootbarImpl);

export class FullCardFootbar extends React.Component {
  render() {
    const { children, node, ...rest } = this.props;
    let account = this.context.account;
    if (node && node.meta) {
      if (this.props.node.isOwnedBy(account)) {
        return (
          <PrivateFullCardFootbar nid={node.nid} meta={node.meta} {...rest}>
            {children}
          </PrivateFullCardFootbar>
        );
      } else {
        return (
          <PublicFullCardFootbar nid={node.nid} {...rest}>
            {children}
          </PublicFullCardFootbar>
        );
      }
    }
    // TODO(akindyakov): empty footbard to allocate space?
    return null;
  }
}

// FullCardFootbar.contextType = MzdGlobalContext;
