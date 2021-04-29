import React from "react";

import PropTypes from "prop-types";
import { withRouter, Link } from "react-router-dom";

import axios from "axios";
import moment from "moment";

import { Card } from "react-bootstrap";

import { smugler } from "./../smugler/api";
import { ReadOnlyRender } from "./../doc/ReadOnlyRender";
import { joinClasses } from "./../util/elClass.js";
import { Loader } from "./../lib/loader";
import { MzdGlobalContext } from "./../lib/global.js";

import { AuthorFooter } from "./AuthorBadge";
import { XsCard } from "./ShrinkCard";

import LockedImg from "./../img/locked.png";

import styles from "./SmallCard.module.css";

function getShadowStyle(n) {
  switch (Math.max(0, n) /* treat negative numbers as 0 */) {
    case 0:
      return styles.small_card_shadow_0;
    case 1:
      return styles.small_card_shadow_1;
    case 2:
      return styles.small_card_shadow_2;
    case 3:
      return styles.small_card_shadow_3;
    case 4:
      return styles.small_card_shadow_4;
    default:
      break;
  }
  return styles.small_card_shadow_5;
}

export const SeeMoreButton = React.forwardRef(
  ({ onClick, className, disabled, on }, ref) => {
    return (
      <div
        className={joinClasses(styles.a_see_more, className)}
        ref={ref}
        onClick={onClick}
        disabled={disabled}
      >
        {on ? "See less" : "See more"}
      </div>
    );
  }
);

export class SmallCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      seeAll: false,
    };
  }

  static propTypes = {
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
  };

  componentDidUpdate(prevProps) {}

  componentDidMount() {}

  componentWillUnmount() {}

  onClick = () => {
    if (this.props.onClick) {
      this.props.onClick(this.props.nid, this.state.node.doc);
    } else {
      this.props.history.push({
        pathname: "/n/" + this.props.nid,
      });
    }
  };

  fetchPreface = () => {
    let account = this.context.account;
    smugler.node
      .get({
        nid: this.props.nid,
        cancelToken: this.fetchPrefaceCancelToken.token,
        account: account,
      })
      .catch((error) => {
        console.log("Fetch node failed with error:", error);
      })
      .then((node) => {
        if (node) {
          this.setState({
            node: node,
          });
        }
      });
  };

  toggleSeeMore = () => {
    this.setState((state) => {
      return {
        seeAll: !state.seeMore,
      };
    });
  };

  render() {
    console.log("SmallCard.render");
    let clickableOnClick = null;
    let clickableStyle = null;
    let seeAll = null;
    if (this.props.clickable || this.props.onClick) {
      clickableStyle = styles.clickable_chunks;
      clickableOnClick = this.onClick;
    } else {
      seeAll = (
        <SeeMoreButton onClick={this.toggleSeeMore} on={this.state.seeAll} />
      );
    }
    let body = (
      <ReadOnlyRender nid={this.props.nid} preface={this.props.preface} />
    );
    if (!this.state.seeAll) {
      body = <XsCard>{body}</XsCard>;
    }
    // const shd = getShadowStyle(
    //   this.props.edges.length +
    //     this.state.edges.length -
    //     (this.props.skip_input_edge ? 1 : 0)
    // );
    let footbar = null;
    if (this.props.footbar) {
      footbar = this.props.footbar;
    }
    return (
      <div
        className={joinClasses(
          styles.small_card,
          styles.small_card_width,
          clickableStyle
        )}
        ref={this.props.cardRef}
        onClick={clickableOnClick}
      >
        {body}
        {footbar}
      </div>
    );
  }
}

SmallCard.contextType = MzdGlobalContext;
SmallCard.defaultProps = { skip_input_edge: false, edges: [] };
SmallCard = withRouter(SmallCard);

export class GenericSmallCard extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    let clickableStyle = null;
    let clickableOnClick = null;
    if (this.props.onClick) {
      clickableStyle = styles.clickable_chunks;
      clickableOnClick = this.props.onClick;
    }
    let header = this.props.header ? (
      <Card.Header>{this.props.header}</Card.Header>
    ) : null;
    let footer = null;
    if (this.props.footer) {
      footer = (
        <footer className="text-muted text-right px-2 pb-2 m-0 pt-0">
          {this.props.footer}
        </footer>
      );
    }
    return (
      <Card
        className={joinClasses(
          styles.small_card,
          styles.small_card_width,
          clickableStyle
        )}
        nid={this.props.nid}
        ref={this.props.cardRef}
        onClick={clickableOnClick}
      >
        {header}
        <Card.Body className={styles.card_body}>
          {this.props.children}
        </Card.Body>
        {footer}
      </Card>
    );
  }
}

GenericSmallCard.defaultProps = { header: null, footer: null, onClick: null };

export default SmallCard;
