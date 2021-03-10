import React from "react";

import "./Triptych.css";
import styles from "./Triptych.module.css";

import StickyOnImg from "./img/sticky-on.png";
import StickyAddImg from "./img/sticky-add.png";
import StickyAddHoverImg from "./img/sticky-add-hover.png";
import StickyRemoveImg from "./img/sticky-remove.png";

import CutTheRefImg from "./img/cut-the-ref.png";

import { DocRender } from "./../doc/doc";

import NodeSmallCard from "./../NodeSmallCard";
import small_card_styles from "./../NodeSmallCard.module.css";

import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";

import { joinClasses } from "../util/elClass.js";
import { MzdGlobalContext } from "../lib/global.js";
import { smugler } from "../smugler/api.js";

import { Button, ButtonGroup, Container, Row, Col } from "react-bootstrap";

import axios from "axios";
import moment from "moment";

class StickinessSwitcher extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      on: this.props.on,
      hover: false,
    };
  }

  onHover = () => {
    this.setState({ hover: true });
  };

  offHover = () => {
    this.setState({ hover: false });
  };

  switch = () => {
    const off = !this.state.on;
    this.setState({ on: off });
    this.props.switch(off);
  };

  render() {
    var img;
    var alt;
    if (this.state.on) {
      if (this.state.hover) {
        img = StickyRemoveImg;
      } else {
        img = StickyOnImg;
      }
      alt = "Make not sticky";
    } else {
      if (this.state.hover) {
        img = StickyAddHoverImg;
      } else {
        img = StickyAddImg;
      }
      alt = "Make sticky";
    }
    return (
      <Button
        variant=""
        className={styles.on_card_btn}
        onClick={this.switch}
        onMouseEnter={this.onHover}
        onMouseLeave={this.offHover}
      >
        <img src={img} className={styles.btn_img} alt={alt} />
      </Button>
    );
  }
}

class RefNodeCardImpl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hover: false,
      preface: "",
      crtd: moment().unix(),
      upd: moment().unix(),
      is_sticky: props.edge.is_sticky,
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

  onHover = () => {
    this.setState({ hover: true });
  };

  offHover = () => {
    this.setState({ hover: false });
  };

  handleRefCutOff = () => {
    const req = {
      eid: this.props.eid,
    };
    axios
      .delete("/api/node/x/edge", {
        cancelToken: this.fetchCancelToken.token,
        data: req,
      })
      .then((res) => {
        if (res) {
          this.props.cutOffRef(this.props.eid);
        }
      });
  };

  handleToggleStickiness = (on) => {
    const req = {
      is_sticky: on,
    };
    axios
      .patch("/api/edge/" + this.props.eid, req, {
        cancelToken: this.fetchCancelToken.token,
      })
      .then((res) => {
        if (res) {
          this.setState((state) => {
            return { is_sticky: on };
          });
          this.props.switchStickiness(this.props.edge, on);
        }
      });
  };

  render() {
    var toolbar;
    if (this.state.hover) {
      toolbar = (
        <ButtonGroup>
          <Button
            variant=""
            className={styles.on_card_btn}
            onClick={this.handleRefCutOff}
          >
            <img
              src={CutTheRefImg}
              className={styles.btn_img}
              alt={"cut off the ref"}
            />
          </Button>
          <StickinessSwitcher
            on={this.props.edge.is_sticky}
            switch={this.handleToggleStickiness}
          />
        </ButtonGroup>
      );
    }
    return (
      <div
        className={joinClasses(
          "meta-fluid-container",
          small_card_styles.small_card_width
        )}
        onMouseEnter={this.onHover}
        onMouseLeave={this.offHover}
      >
        <div className="meta-fluid-el-top-right">{toolbar}</div>
        <NodeSmallCard
          nid={this.props.nid}
          preface={null}
          crtd={null}
          upd={null}
          skip_input_edge={true}
        />
      </div>
    );
  }
}

const RefNodeCard = withRouter(RefNodeCardImpl);

class NodeRefsImpl extends React.Component {
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

const NodeRefs = withRouter(NodeRefsImpl);

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
      console.log(
        "Triptych::componentDidUpdate, refetch",
        prevProps,
        this.props
      );
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
        console.log("fetchNode :: resp", node);
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

  cutOffLeftRef = (eid) => {
    this.setState((state) => {
      const rm = (edge) => edge.eid !== eid;
      return {
        edges_left: state.edges_left.filter(rm),
        edges_sticky: state.edges_sticky.filter(rm),
      };
    });
  };

  cutOffRightRef = (eid) => {
    this.setState((state) => {
      const rm = (edge) => edge.eid !== eid;
      return {
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
              cutOffRef={this.cutOffLeftRef}
              switchStickiness={this.switchStickiness}
              className={styles.node_refs_left}
            />
          </Col>
          <Col className={styles.note_col}>
            <DocRender
              nid={this.props.nid}
              addRef={this.addRef}
              stickyEdges={this.state.edges_sticky}
              node={this.state.node}
              updateNode={this.updateNode}
            />
          </Col>
          <Col className={styles.refs_col}>
            <NodeRefs
              nid={this.props.nid}
              edges={this.state.edges_right}
              cutOffRef={this.cutOffRightRef}
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
