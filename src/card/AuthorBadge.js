import React from "react";

import styles from "./AuthorBadge.module.css";

import PropTypes from "prop-types";
import { withRouter, useHistory } from "react-router-dom";

import { Loader } from "../lib/loader";
import { MzdGlobalContext } from "./../lib/global";

import { joinClasses } from "../util/elClass.js";

import { HoverTooltip } from "./../lib/tooltip";
import { smugler } from "./../smugler/api";

import { Card, Button, ButtonGroup } from "react-bootstrap";

import UserDefaultPic from "./../auth/img/user-default-pic.png";

export class AuthorBadge extends React.Component {
  constructor(props) {
    super(props);
    this.state = { badge: null };
    this.fetchBadgeCancelToken = smugler.makeCancelToken();
  }

  componentDidMount() {
    if (!this.state.badge) {
      this.fetchBadge();
    }
  }

  componentWillUnmount() {
    this.fetchBadgeCancelToken.cancel();
  }

  componentDidUpdate(prevProps) {
    if (this.props.uid !== prevProps.uid) {
      this.fetchBadge();
    }
  }

  fetchBadge() {
    const uid = this.props.uid;
    if (uid) {
      smugler.user.badge
        .get({
          uid: uid,
          cancelToken: this.fetchBadgeCancelToken.token,
        })
        .then((badge) => {
          if (badge) {
            this.setState({ badge: badge });
          }
        });
    }
  }

  render() {
    const badge = this.state.badge;
    const photo = badge && badge.photo ? badge.photo : UserDefaultPic;
    const name = badge && badge.name ? badge.name : null;
    return (
      <div className={styles.badge}>
        <div className={styles.column}>
          <img src={photo} className={styles.user_pic_image} alt={"user"} />
        </div>
        <div className={styles.column}>
          <div className={styles.user_name}>{name}</div>
          <div className={styles.created_at_date}>
            {this.props.created_at.fromNow()}
          </div>
        </div>
      </div>
    );
  }
}

export class TimeBadge extends React.Component {
  render() {
    // Created {this.props.created_at.fromNow()},
    return (
      <div className={styles.badge}>
        <div className={styles.column}>
          <div className={styles.created_at_date}>
            Updated {this.props.updated_at.fromNow()}
          </div>
        </div>
      </div>
    );
  }
}

export class AuthorFooter extends React.Component {
  render() {
    const node = this.props.node;
    if (!node) {
      return null;
    }
    let account = this.context.account;
    if (account && node.isOwnedBy(account)) {
      return (
        <footer className={styles.author_footer}>
          <TimeBadge
            created_at={node.created_at}
            updated_at={node.updated_at}
          />
        </footer>
      );
    }
    return (
      <footer className={styles.author_footer}>
        <AuthorBadge created_at={node.created_at} uid={node.getOwner()} />
      </footer>
    );
  }
}

AuthorBadge.contextType = MzdGlobalContext;
AuthorFooter.contextType = MzdGlobalContext;
