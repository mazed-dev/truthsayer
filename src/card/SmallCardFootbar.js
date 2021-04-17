import React from "react";

import { withRouter } from "react-router-dom";
import { Button, ButtonToolbar, ButtonGroup, Dropdown } from "react-bootstrap";

import PropTypes from "prop-types";

import { smugler } from "./../smugler/api";

import styles from "./SmallCardFootbar.module.css";

import StickyRefOffImg from "./../img/sticky-ref-checkbox-off.png";
import StickyRefOnImg from "./../img/sticky-ref-checkbox-on.png";
import CutTheRefImg from "./../img/cut-the-ref.png";

import EllipsisImg from "./../img/ellipsis.png";

import { MzdGlobalContext } from "../lib/global";
import { HoverTooltip } from "../lib/tooltip";
import { ImgButton } from "../lib/ImgButton";
import { goto } from "../lib/route.jsx";
import { joinClasses } from "../util/elClass.js";
import { CheckBox } from "./../lib/CheckBox.js";

class PrivateSmallCardFootbar extends React.Component {
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
    const eid = this.props.edge.eid;
    smugler.edge
      .delete({
        eid: eid,
        cancelToken: this.deleteEdgeCancelToken.token,
      })
      .then((res) => {
        if (res) {
          this.props.cutOffRef(eid);
        }
      });
  };

  render() {
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
          <StickinessSwitcher
            is_on={this.state.isSticky}
            onToggle={this.switchStickiness}
          />
        </ButtonToolbar>
      </>
    );
  }
}

PrivateSmallCardFootbar.contextType = MzdGlobalContext;

PrivateSmallCardFootbar = withRouter(PrivateSmallCardFootbar);

class PublicSmallCardFootbarImpl extends React.Component {
  render() {
    return (
      <ButtonToolbar className={joinClasses(styles.toolbar)}>
        <StickinessSwitcher
          is_on={this.props.edge.is_sticky}
          is_disabled={true}
        />
      </ButtonToolbar>
    );
  }
}

function StickinessSwitcher({ is_on, onToggle, is_disabled }) {
  is_disabled = is_disabled || false;
  const tooltip = is_on ? "Sticky link" : "Not sticky link";
  const img = is_on ? StickyRefOnImg : StickyRefOffImg;
  return (
    <ImgButton
      className={joinClasses(styles.tool_button, styles.toolbar_layout_item)}
      onClick={onToggle}
      is_disabled={is_disabled}
    >
      <HoverTooltip tooltip={tooltip}>
        <CheckBox is_checked={is_on} />
        <img src={img} className={styles.tool_button_img} alt={tooltip} />
      </HoverTooltip>
    </ImgButton>
  );
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
