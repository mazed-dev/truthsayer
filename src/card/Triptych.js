import React from "react";

import styles from "./Triptych.module.css";

import { DocRender } from "./../doc/doc";

import NodeSmallCard from "./../NodeSmallCard";

import { SmallCardFootbar } from "./../card/SmallCardFootbar";

import { withRouter } from "react-router-dom";

import { MzdGlobalContext } from "../lib/global.js";
import { smugler } from "../smugler/api.js";

import { Container, Row, Col } from "react-bootstrap";

import moment from "moment";

class RefNodeCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hover: false,
      preface: "",
      crtd: moment().unix(),
      upd: moment().unix(),
      is_sticky: props.edge.is_sticky,
    };
  }

  componentWillUnmount() {}

  render() {
    const footbar = (
      <SmallCardFootbar
        edge={this.props.edge}
        switchStickiness={this.props.switchStickiness}
        cutOffRef={this.props.cutOffRef}
      />
    );
    return (
      <NodeSmallCard
        nid={this.props.nid}
        preface={null}
        crtd={null}
        upd={null}
        skip_input_edge={true}
        footbar={footbar}
      />
    );
  }
}

RefNodeCard.contextType = MzdGlobalContext;

class NodeRefs extends React.Component {
  render() {
    const refs = this.props.edges.map((edge) => {
      var to_nid = null;
      var from_nid = null;
      var nid = null;
      if (edge.from_nid === this.props.nid) {
        from_nid = edge.from_nid;
        nid = edge.to_nid;
      } else {
        to_nid = edge.to_nid;
        nid = edge.from_nid;
      }
      return (
        <RefNodeCard
          nid={nid}
          eid={edge.eid}
          to_nid={to_nid}
          from_nid={from_nid}
          key={edge.eid}
          edge={edge}
          switchStickiness={this.props.switchStickiness}
          cutOffRef={this.props.cutOffRef}
        />
      );
    });
    return <div className={this.props.className}>{refs}</div>;
  }
}

class Triptych extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      node: null,
      edges_left: [],
      edges_right: [],
      edges_sticky: [],
    };
    this.toEdgesCancelToken = smugler.makeCancelToken();
    this.fromEdgesCancelToken = smugler.makeCancelToken();
    this.fetchNodeCancelToken = smugler.makeCancelToken();
  }

  componentDidMount() {
    this.fetchEdges();
    this.fetchNode();
  }

  componentWillUnmount() {
    this.toEdgesCancelToken.cancel();
    this.fromEdgesCancelToken.cancel();
    this.fetchNodeCancelToken.cancel();
  }

  componentDidUpdate(prevProps) {
    // Don't forget to compare props!
    if (this.props.nid !== prevProps.nid) {
      this.fetchEdges();
      this.fetchNode();
    }
  }

  fetchEdges = () => {
    smugler.edge
      .getTo({
        nid: this.props.nid,
        cancelToken: this.toEdgesCancelToken.token,
      })
      .then((star) => {
        if (star) {
          const edges_sticky = star.edges.filter((edge) => {
            return edge.is_sticky;
          });
          this.setState((state) => {
            return {
              edges_left: star.edges,
              edges_sticky: state.edges_sticky.concat(edges_sticky),
            };
          });
        }
      });
    smugler.edge
      .getFrom({
        nid: this.props.nid,
        cancelToken: this.toEdgesCancelToken.token,
      })
      .then((star) => {
        if (star) {
          const edges_sticky = star.edges.filter((edge) => {
            return edge.is_sticky;
          });
          this.setState((state) => {
            return {
              edges_right: star.edges,
              edges_sticky: state.edges_sticky.concat(edges_sticky),
            };
          });
        }
      });
  };

  fetchNode = () => {
    const nid = this.props.nid;
    let account = this.context.account;
    return smugler.node
      .get({
        nid: nid,
        cancelToken: this.fetchNodeCancelToken.token,
        account: account,
      })
      .then((node) => {
        if (node) {
          this.setState({
            node: node,
          });
        }
      });
  };

  updateNode = (doc) => {
    // For callback
    let account = this.context.account;
    return smugler.node
      .update({
        nid: this.props.nid,
        doc: doc,
        cancelToken: this.fetchNodeCancelToken.token,
        account: account,
      })
      .then((resp) => {
        this.setState((state) => {
          let node = state.node;
          node.doc = doc;
          return { node: node };
        });
        return resp;
      });
  };

  cutOffRef = (eid) => {
    this.setState((state) => {
      const rm = (edge) => edge.eid !== eid;
      return {
        edges_left: state.edges_left.filter(rm),
        edges_right: state.edges_right.filter(rm),
        edges_sticky: state.edges_sticky.filter(rm),
      };
    });
  };

  addRef = ({ edge, left }) => {
    if (left) {
      this.setState((state) => {
        return {
          edges_left: state.edges_left.concat([edge]),
        };
      });
    } else {
      this.setState((state) => {
        return {
          edges_right: state.edges_right.concat([edge]),
        };
      });
    }
  };

  switchStickiness = (edge, on = false) => {
    console.log("switchStickiness", on, edge);
    if (on) {
      edge.is_sticky = true;
      this.setState((state) => {
        const new_sticky_edges = state.edges_sticky.concat([edge]);
        return {
          edges_sticky: new_sticky_edges,
        };
      });
    } else {
      const rm = (e) => edge.eid !== e.eid;
      this.setState((state) => {
        const filtered = state.edges_sticky.filter(rm);
        return {
          edges_sticky: filtered,
        };
      });
    }
  };

  render() {
    return (
      <Container fluid>
        <Row className="d-flex justify-content-center">
          <Col className={styles.refs_col}>
            <NodeRefs
              nid={this.props.nid}
              edges={this.state.edges_left}
              cutOffRef={this.cutOffRef}
              switchStickiness={this.switchStickiness}
              className={styles.node_refs_left}
            />
          </Col>
          <Col className={styles.note_col}>
            <DocRender
              node={this.state.node}
              addRef={this.addRef}
              stickyEdges={this.state.edges_sticky}
              updateNode={this.updateNode}
            />
          </Col>
          <Col className={styles.refs_col}>
            <NodeRefs
              nid={this.props.nid}
              edges={this.state.edges_right}
              cutOffRef={this.cutOffRef}
              switchStickiness={this.switchStickiness}
            />
          </Col>
        </Row>
      </Container>
    );
  }
}

Triptych.contextType = MzdGlobalContext;

export default withRouter(Triptych);
