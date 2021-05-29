import React from "react";

import { withRouter, Link } from "react-router-dom";
import { Button, ButtonToolbar, ButtonGroup } from "react-bootstrap";

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
import { MeatballsButton } from "./MeatballsButton";
import {
  FootbarDropdown,
  FootbarDropdownDivider,
  FootbarDropdownItem,
  FootbarDropdownMenu,
  FootbarDropdownToggle,
  FootbarDropdownToggleMeatballs,
} from "./Footbar";

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
    let { isSticky } = this.state;
    isSticky = !isSticky;
    smugler.edge
      .sticky({
        on: isSticky,
        eid: this.props.edge.eid,
        cancelToken: this.toggleStickinessCancelToken.token,
      })
      .then((res) => {
        const { switchStickiness, edge } = this.props;
        if (res) {
          this.setState({ isSticky: isSticky });
          switchStickiness(edge, isSticky);
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
    const cutTooltip = "Cut the link";
    const { isSticky } = this.state;
    const { nid } = this.props;
    const magnetTooltip = isSticky
      ? "Demagnetise the link"
      : "Magnetise the link";
    return (
      <>
        <ButtonToolbar className={joinClasses(styles.toolbar)}>
          <ImgButton
            className={joinClasses(
              styles.tool_button,
              styles.toolbar_layout_item
            )}
            as={Link}
            to={"/n/" + nid}
          >
            Open
          </ImgButton>
          <FootbarDropdown>
            <FootbarDropdownToggleMeatballs
              id={"more-options-for-fullsize-card"}
            />
            <FootbarDropdownMenu>
              <FootbarDropdownItem onClick={this.handleRefCutOff}>
                <img
                  src={CutTheRefImg}
                  className={joinClasses(
                    styles.tool_button_img,
                    styles.menu_item_pic
                  )}
                  alt={cutTooltip}
                />
                {cutTooltip}
              </FootbarDropdownItem>
              <FootbarDropdownItem onClick={this.switchStickiness}>
                <CheckBox is_checked={isSticky} />
                {magnetTooltip}
              </FootbarDropdownItem>
            </FootbarDropdownMenu>
          </FootbarDropdown>
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
  return (
    <ImgButton
      className={joinClasses(styles.tool_button)}
      onClick={onToggle}
      is_disabled={is_disabled}
    ></ImgButton>
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
