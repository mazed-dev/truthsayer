import React from "react";

import PropTypes from "prop-types";
import { withRouter, Link } from "react-router-dom";

import axios from "axios";
import moment from "moment";

import { Card } from "react-bootstrap";

import { smugler } from "./smugler/api";
import { SmallCardRender, exctractDoc } from "./doc/doc";
import { joinClasses } from "./util/elClass.js";
import { Loader } from "./lib/loader";
import { MzdGlobalContext } from "./lib/global.js";

import { AuthorFooter } from "./card/AuthorBadge";

import LockedImg from "./img/locked.png";

import styles from "./NodeSmallCard.module.css";

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

function makeSeeMoreLink(nid) {
  return (
    <Link className={styles.a_see_more} to={"/n/" + nid}>
      See more
    </Link>
  );
}

class NodeSmallCardImpl extends React.Component {
  constructor(props) {
    super(props);
    this.fetchEdgesCancelToken = smugler.makeCancelToken();
    this.fetchPrefaceCancelToken = smugler.makeCancelToken();
    this.state = {
      node: null,
      edges: [],
      crypto: null,
    };
  }

  static propTypes = {
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
  };

  componentDidUpdate(prevProps) {
    if (this.props.nid !== prevProps.nid) {
      if (this.state.preface == null) {
        this.fetchPreface();
      } else {
        this.setState({
          doc: exctractDoc(this.props.preface, this.props.nid),
        });
      }
    }
  }

  componentDidMount() {
    if (this.state.preface == null) {
      this.fetchPreface();
    } else {
      this.setState({
        doc: exctractDoc(this.props.preface, this.props.nid),
      });
    }
  }

  componentWillUnmount() {
    this.fetchEdgesCancelToken.cancel();
    this.fetchPrefaceCancelToken.cancel();
  }

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

  render() {
    let body = null;
    let clickableOnClick = null;
    let clickableStyle = null;
    let seeMore = null;
    if (this.props.clickable || this.props.onClick) {
      clickableStyle = styles.clickable_chunks;
      clickableOnClick = this.onClick;
    } else {
      seeMore = makeSeeMoreLink(this.props.nid);
    }
    const node = this.state.node;
    if (node == null) {
      body = (
        <div className={styles.small_card_waiter}>
          <Loader size={"small"} />
        </div>
      );
    } else {
      if (!node.crypto.success) {
        body = (
          <>
            <img src={LockedImg} className={styles.locked_img} alt={"locked"} />
            Encrypted with an unknown secret:
            <code className={styles.locked_secret_id}>
              {node.crypto.secret_id}
            </code>
            {seeMore}
          </>
        );
      } else {
        body = (
          <>
            <SmallCardRender
              doc={node.doc}
              nid={clickableOnClick === null ? this.props.nid : null}
              trim={true}
            />
            {seeMore}
          </>
        );
      }
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
        <Card.Body className="px-3 pt-2 pb-0">{body}</Card.Body>
        <AuthorFooter node={this.state.node} />
        {footbar}
      </Card>
    );
  }
}

NodeSmallCardImpl.contextType = MzdGlobalContext;
NodeSmallCardImpl.defaultProps = { skip_input_edge: false, edges: [] };

export const NodeSmallCard = withRouter(NodeSmallCardImpl);

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
        <Card.Body className="px-3 pt-2 pb-0">{this.props.children}</Card.Body>
        {footer}
      </Card>
    );
  }
}

GenericSmallCard.defaultProps = { header: null, footer: null, onClick: null };

export default NodeSmallCard;
