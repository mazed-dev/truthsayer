import React from "react";

import "./FullNodeView.css";
import styles from "./FullNodeView.module.css";

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

import remoteErrorHandler from "./../remoteErrorHandler";

import { LeftToolBar, RightToolBar } from "./ToolBars.js";

import { joinClasses } from "../util/elClass.js";

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
      .catch(remoteErrorHandler(this.props.history))
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
      .catch(remoteErrorHandler(this.props.history))
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

export const NO_EXT_CLICK_DETECTION = "ignoreextclick";

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

class FullNodeView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      edges_left: [],
      edges_right: [],
      edges_sticky: [],
      aux_toolbar: null,
    };
    this.fetchCancelToken = axios.CancelToken.source();
  }

  componentDidMount() {
    this.fetchEdges();
  }

  componentWillUnmount() {
    this.fetchCancelToken.cancel();
  }

  componentDidUpdate(prevProps) {
    // Don't forget to compare props!
    if (this.props.nid !== prevProps.nid) {
      this.fetchEdges();
    }
  }

  fetchEdges = () => {
    axios
      .get("/api/node/" + this.props.nid + "/edge", {
        cancelToken: this.fetchCancelToken.token,
      })
      .catch(remoteErrorHandler(this.props.history))
      .then((res) => {
        if (res) {
          var edges_left = [];
          var edges_right = [];
          var edges_sticky = [];
          res.data.edges.forEach((edge) => {
            if (edge.from_nid === this.props.nid) {
              edges_right.push(edge);
            } else {
              edges_left.push(edge);
            }
            if (edge.is_sticky) {
              edges_sticky.push(edge);
            }
          });
          this.setState({
            edges_left: edges_left,
            edges_right: edges_right,
            edges_sticky: edges_sticky,
          });
        }
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

  addLeftRef = (edge) => {
    this.setState((state) => {
      return {
        edges_left: state.edges_left.concat([edge]),
      };
    });
  };

  addRightRef = (edge) => {
    this.setState((state) => {
      return {
        edges_right: state.edges_right.concat([edge]),
      };
    });
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

  resetAuxToolbar = (el) => {
    if (el) {
      this.setState({ aux_toolbar: el });
    } else {
      this.setState({ aux_toolbar: null });
    }
  };

  render() {
    return (
      <Container fluid>
        <Row className="d-flex justify-content-center">
          <Col>
            <NodeRefs
              nid={this.props.nid}
              edges={this.state.edges_left}
              cutOffRef={this.cutOffLeftRef}
              switchStickiness={this.switchStickiness}
              className={styles.node_refs_left}
            />
          </Col>
          <Col className={styles.toolbar_col}>
            <LeftToolBar
              nid={this.props.nid}
              sticky_edges={this.state.edges_sticky}
              addRef={this.addLeftRef}
            />
          </Col>
          <Col className={styles.note_col}>
            <DocRender
              nid={this.props.nid}
              sticky_edges={this.state.edges_sticky}
              addLeftRef={this.addLeftRef}
              addRightRef={this.addRightRef}
              resetAuxToolbar={this.resetAuxToolbar}
            />
          </Col>
          <Col className={styles.toolbar_col}>
            <RightToolBar
              nid={this.props.nid}
              sticky_edges={this.state.edges_sticky}
              addRef={this.addRightRef}
            >
              {this.state.aux_toolbar}
            </RightToolBar>
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

export default withRouter(FullNodeView);
