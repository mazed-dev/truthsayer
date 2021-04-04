import React from "react";

import { withRouter } from "react-router-dom";
import { Button, ButtonToolbar, ButtonGroup, Dropdown } from "react-bootstrap";

import PropTypes from "prop-types";

import { smugler } from "./../smugler/api";

import styles from "./SmallCardFootbar.module.css";

import StickyRefOffImg from "./../img/sticky-ref-off.png";
import StickyRefOnImg from "./../img/sticky-ref-on.png";
import CutTheRefImg from "./../img/cut-the-ref.png";

import EllipsisImg from "./../img/ellipsis.png";

import { MzdGlobalContext } from "../lib/global";
import { HoverTooltip } from "../lib/tooltip";
import { ImgButton } from "../lib/ImgButton";
import { goto } from "../lib/route.jsx";
import { joinClasses } from "../util/elClass.js";

class PrivateSmallCardFootbarImpl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isSticky: this.props.edge.is_sticky,
    };
    this.toggleStickinessCancelToken = smugler.makeCancelToken();
    this.deleteEdgeCancelToken = smugler.makeCancelToken();
  }

  static propTypes = {
    history: PropTypes.object.isRequired,
  };

  componentDidUpdate(prevProps) {
    // Don't forget to compare props!
    if (this.props.edge.is_sticky !== prevProps.edge.is_sticky) {
      this.setState({
        isSticky: this.props.edge.is_sticky,
      });
    }
  }

  switchStickiness = () => {
    const on = !this.state.isSticky;
    smugler.edge
      .sticky({
        on: on,
        eid: this.props.edge.eid,
        cancelToken: this.toggleStickinessCancelToken.token,
      })
      .then((res) => {
        if (res) {
          this.setState({ isSticky: on });
          this.props.switchStickiness(this.props.edge, on);
        }
      });
  };

  handleRefCutOff = () => {
    const req = {
      eid: this.props.eid,
    };
    smugler.edge
      .delete({
        eid: this.props.eid,
        cancelToken: this.deleteEdgeCancelToken.token,
      })
      .then((res) => {
        if (res) {
          this.props.cutOffRef(this.props.eid);
        }
      });
  };

  render() {
    let stickinessTooltip = null;
    let stickinessImg = null;
    if (this.state.isSticky) {
      stickinessTooltip = "Sticky link";
      stickinessImg = StickyRefOnImg;
    } else {
      stickinessTooltip = "Not sticky link";
      stickinessImg = StickyRefOffImg;
    }
    let cutTooltip = "Cut the link";
    return (
      <>
        <ButtonToolbar className={joinClasses(styles.toolbar)}>
          <ImgButton
            onClick={this.handleRefCutOff}
            className={joinClasses(
              styles.tool_button,
              styles.toolbar_layout_item
            )}
          >
            <HoverTooltip tooltip={cutTooltip}>
              <img
                src={CutTheRefImg}
                className={styles.tool_button_img}
                alt={cutTooltip}
              />
            </HoverTooltip>
          </ImgButton>
          <ImgButton
            onClick={this.switchStickiness}
            className={joinClasses(
              styles.tool_button,
              styles.toolbar_layout_item
            )}
          >
            <HoverTooltip tooltip={stickinessTooltip}>
              <img
                src={stickinessImg}
                className={styles.tool_button_img}
                alt={stickinessTooltip}
              />
            </HoverTooltip>
          </ImgButton>
        </ButtonToolbar>
      </>
    );
  }
}

PrivateSmallCardFootbarImpl.contextType = MzdGlobalContext;

const PrivateSmallCardFootbar = withRouter(PrivateSmallCardFootbarImpl);

class PublicSmallCardFootbarImpl extends React.Component {
  render() {
    let tooltip = null;
    let img = null;
    if (this.props.edge.is_sticky) {
      tooltip = "Sticky link";
      img = StickyRefOnImg;
    } else {
      tooltip = "Not sticky link";
      img = StickyRefOffImg;
    }
    return (
      <>
        <ButtonToolbar className={joinClasses(styles.toolbar)}>
          <ImgButton
            className={joinClasses(
              styles.tool_button,
              styles.toolbar_layout_item
            )}
            onClick={null}
            disabled={true}
          >
            <HoverTooltip tooltip={tooltip}>
              <img src={img} className={styles.tool_button_img} alt={tooltip} />
            </HoverTooltip>
          </ImgButton>
        </ButtonToolbar>
      </>
    );
  }
}

PublicSmallCardFootbarImpl.contextType = MzdGlobalContext;

const PublicSmallCardFootbar = withRouter(PublicSmallCardFootbarImpl);

export class SmallCardFootbar extends React.Component {
  render() {
    const { children, edge, ...rest } = this.props;
    let account = this.context.account;
    const isOwned = edge.isOwnedBy(account);
    if (isOwned) {
      return (
        <PrivateSmallCardFootbar edge={edge} {...rest}>
          {children}
        </PrivateSmallCardFootbar>
      );
    } else {
      return (
        <PublicSmallCardFootbar edge={edge} {...rest}>
          {children}
        </PublicSmallCardFootbar>
      );
    }
    // TODO(akindyakov): empty footbard to allocate space?
    return null;
  }
}

SmallCardFootbar.contextType = MzdGlobalContext;
