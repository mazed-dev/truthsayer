import React from "react";

import "./FullNodeView.css";

import NodeSmallCard from "./NodeSmallCard";

import maze from "./maze.png";

import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";

import remoteErrorHandler from "./remoteErrorHandler";

import {
  Card,
  Button,
  ButtonGroup,
  InputGroup,
  Form,
  Container,
  Row,
  Col,
  CardColumns,
  DropdownButton,
  Dropdown,
} from "react-bootstrap";

// https://github.com/rexxars/react-markdown
import ReactMarkdown from "react-markdown";

import axios from "axios";
import moment from "moment";
import queryString from "query-string";

const hash = require("object-hash");

class RefNodeCardImpl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hover: false,
      preface: "",
      crtd: moment().unix(),
      upd: moment().unix(),
    };
    this.fetchCancelToken = axios.CancelToken.source();
  }

  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate(prevProps) {
    if (this.props.nid !== prevProps.nid) {
      this.fetchData();
    }
  }

  componentWillUnmount() {
    this.fetchCancelToken.cancel();
  }

  fetchData = () => {
    axios
      .get(
        "/node?" +
          queryString.stringify({
            nid: this.props.nid,
            preview: true,
          }),
        {
          cancelToken: this.fetchCancelToken.token,
        }
      )
      .catch(remoteErrorHandler(this.props.history))
      .then((res) => {
        if (res) {
          this.setState({
            preface: res.data,
            crtd: moment(res.headers["x-created-at"]).unix(),
            upd: moment(res.headers["last-modified"]).unix(),
          });
        }
      });
  };

  onHover = () => {
    this.setState({ hover: true });
  };

  offHover = () => {
    this.setState({ hover: false });
  };

  linkOffer = () => {
    const req = {
      from_nid: parseInt(this.props.from_nid),
      to_nid: parseInt(this.props.nid),
      txt: this.props.ref_txt,
      weight: 100,
    };
    axios
      .post("/edge", req, {
        cancelToken: this.fetchCancelToken.token,
      })
      .catch(remoteErrorHandler(this.props.history))
      .then((res) => {
        if (res) {
        }
      });
  };

  render() {
    const title_el = (
      <Button variant="outline-danger" size="sm">
        {this.props.ref_txt}
      </Button>
    );
    var toolbar = title_el;
    if (this.props.offer) {
      toolbar = (
        <ButtonGroup>
          <Button variant="outline-success" size="sm" onClick={this.linkOffer}>
            &#43;
          </Button>
          {title_el}
        </ButtonGroup>
      );
    } else {
      if (this.state.hover) {
        toolbar = (
          <ButtonGroup>
            {title_el}
            <Button variant="outline-dark" size="sm">
              &#9998;
            </Button>
            <Button variant="outline-dark" size="sm">
              &#9988;
            </Button>
            <DropdownButton
              as={ButtonGroup}
              title="&#x22EE;&nbsp;"
              id="bg-vertical-dropdown-1"
              variant="outline-dark"
              size="sm"
            >
              <Dropdown.Item eventKey="1">&#x2602;</Dropdown.Item>
              <Dropdown.Item eventKey="2">&#x263C;</Dropdown.Item>
              <Dropdown.Item eventKey="3">&#x263D;</Dropdown.Item>
            </DropdownButton>
          </ButtonGroup>
        );
      }
    }
    return (
      <div
        className="meta-fluid-container"
        onMouseEnter={this.onHover}
        onMouseLeave={this.offHover}
      >
        <NodeSmallCard
          nid={this.props.nid}
          preface={this.state.preface}
          crtd={this.state.crtd}
          upd={this.state.upd}
        />
        <div className="meta-fluid-el-top-left">{toolbar}</div>
      </div>
    );
  }
}

RefNodeCardImpl.defaultProps = { offer: false };

const RefNodeCard = withRouter(RefNodeCardImpl);

class ExtClickDetector extends React.Component {
  constructor(props) {
    super(props);
    this.selfRef = React.createRef();
  }
  componentDidMount() {
    document.addEventListener("mousedown", this.handleClick, false);
  }
  componentWillUnmount() {
    document.removeEventListener("mousedown", this.handleClick, false);
  }
  handleClick = (event) => {
    if (!this.selfRef.current.contains(event.target)) {
      this.props.callback(event);
    }
  };
  render() {
    return <div ref={this.selfRef}>{this.props.children}</div>;
  }
}

class TextEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: this.props.value,
      height: this.getHeightForText(this.props.value),
    };
    this.textAreaRef = React.createRef();
  }

  componentDidMount() {
    this.textAreaRef.current.focus();
  }

  handleChange = (event) => {
    this.setState({
      value: event.target.value,
      height: this.getHeightForText(event.target.value),
    });
    // this.props.onChange(event.target.value);
  };

  getHeightForText = (txt) => {
    // FIXME
    var lines = 2;
    txt.split("\n").forEach(function (item, index) {
      lines = lines + 1 + item.length / 80;
    });
    return Math.max(16, lines * 1.7);
  };

  _onExit = () => {
    this.props.onExit(this.state.value);
  };

  render() {
    return (
      <ExtClickDetector callback={this._onExit}>
        <InputGroup>
          <Form.Control
            as="textarea"
            aria-label="With textarea"
            className="border-0"
            value={this.state.value}
            onChange={this.handleChange}
            style={{ height: this.state.height + "em" }}
            ref={this.textAreaRef}
          />
        </InputGroup>
      </ExtClickDetector>
    );
  }
}

class SearchNewRefToolkitImpl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      search_value: "",
    };
    // this.props.offers_callback
    this.fetchCancelToken = axios.CancelToken.source();
  }

  componentWillUnmount() {
    this.fetchCancelToken.cancel();
  }

  handleChange = (event) => {
    const q = event.target.value;
    this.setState({ search_value: q });
    if (q.length > 2) {
      this.fetchData(q);
    }
  };

  handleSumbit = (event) => {
    event.preventDefault();
    this.fetchData(this.state.search_value);
  };

  fetchData = (q) => {
    axios
      .get("/node/search?" + queryString.stringify({ q: q }), {
        cancelToken: this.fetchCancelToken.token,
      })
      .then((res) => {
        if (res) {
          this.props.offers_callback(res.data.nodes);
        }
      })
      .catch(remoteErrorHandler(this.props.history));
  };

  handleNextClick = () => {
    this.props.history.push("/node/--new--", {
      from: this.props.from_nid,
    });
  };

  render() {
    // Flashlight: &#x1F526;
    return (
      <Card className="rounded">
        <InputGroup className="p-0">
          <InputGroup.Prepend>
            <Button variant="outline-secondary" onClick={this.handleNextClick}>
              <span role="img" aria-label="next">
                &#x2192; &#x2b;
              </span>
            </Button>
          </InputGroup.Prepend>
          <Form.Control
            aria-label="Search-to-link"
            aria-describedby="basic-addon1"
            onChange={this.handleChange}
            onSubmit={this.handleSumbit}
            value={this.state.search_value}
            placeholder="Search to offer"
          />
        </InputGroup>
      </Card>
    );
  }
}
const SearchNewRefToolkit = withRouter(SearchNewRefToolkitImpl);

class NodeRefs extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      offers: [],
      refs: [],
    };
    this.fetchCancelToken = axios.CancelToken.source();
  }

  componentDidMount() {
    this.fetchData();
  }

  componentWillUnmount() {
    this.fetchCancelToken.cancel();
  }

  componentDidUpdate(prevProps) {
    // Don't forget to compare props!
    if (this.props.from_nid !== prevProps.from_nid) {
      this.fetchData();
    }
  }

  fetchData = () => {
    axios
      .get(
        "/edge/star?" + queryString.stringify({ nid: this.props.from_nid }),
        {
          cancelToken: this.fetchCancelToken.token,
        }
      )
      .catch(remoteErrorHandler(this.props.history))
      .then((res) => {
        console.log(res);
        if (res) {
          this.setState({
            refs: res.data.edges,
          });
        }
      });
  };

  addOffersCallback = (nodes) => {
    this.setState({
      offers: nodes.map((meta) => {
        return {
          nid: meta.nid,
          txt: "Link",
        };
      }),
    });
  };

  render() {
    const offers = this.state.offers.map((item) => {
      return (
        <RefNodeCard
          nid={item.nid}
          from_nid={this.props.from_nid}
          offer={true}
          ref_txt={item.txt}
          key={hash.sha1(item)}
        />
      );
    });
    const refs = this.state.refs.map((item) => {
      var to_nid, txt;
      if (this.props.from_nid == item.to_nid) {
        to_nid = item.from_nid;
        txt = "<- prev";
      } else {
        to_nid = item.to_nid;
        txt = "next ->";
      }
      return (
        <RefNodeCard
          eid={item.eid}
          nid={to_nid}
          from_nid={this.props.from_nid}
          ref_txt={txt}
          key={hash.sha1(item)}
        />
      );
    });
    return (
      <CardColumns className="meta-node-refs">
        <SearchNewRefToolkit
          from_nid={this.props.from_nid}
          offers_callback={this.addOffersCallback}
        />
        {offers}
        {refs}
      </CardColumns>
    );
  }
}

class NodeCardImpl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      text: "",
      crtd: moment(), // SystemTime,
      upd: moment(), // SystemTime,
      edit: this.isNew(),
    };
    this.fetchCancelToken = axios.CancelToken.source();
  }

  static propTypes = {
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
  };

  componentDidUpdate(prevProps) {
    // Don't forget to compare props!
    if (this.props.nid !== prevProps.nid) {
      this.fetchData();
    }
  }

  componentWillUnmount() {
    this.fetchCancelToken.cancel();
  }

  componentDidMount() {
    this.fetchData();
  }

  isNew() {
    return this.props.nid === "--new--";
  }

  fetchData = () => {
    if (!this.isNew()) {
      axios
        .get("/node?" + queryString.stringify({ nid: this.props.nid }), {
          cancelToken: this.fetchCancelToken.token,
        })
        .catch(remoteErrorHandler(this.props.history))
        .then((res) => {
          if (res) {
            this.setState({
              text: res.data,
              crtd: moment(res.headers["x-created-at"]),
              upd: moment(res.headers["last-modified"]),
            });
          }
        });
    } else {
      this.setState({
        text: "",
        crtd: moment(),
        upd: moment(),
        edit: true,
      });
    }
  };

  onEditExit_ = (value) => {
    this.setState({
      text: value,
      edit: false,
    });
    const config = {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
      cancelToken: this.fetchCancelToken.token,
    };
    if (!this.isNew()) {
      axios
        .patch(
          "/node?" + queryString.stringify({ nid: this.props.nid }),
          value,
          config
        )
        .catch(remoteErrorHandler(this.props.history))
        .then((_res) => {});
    } else {
      axios
        .post("/node", value, config)
        .catch(remoteErrorHandler(this.props.history))
        .then((res) => {
          if (res) {
            const nid = res.data.nid;
            if (this.props.location.state.from) {
              // That means we have to add an edge
              const req = {
                from_nid: parseInt(this.props.location.state.from),
                to_nid: parseInt(nid),
                txt: "next",
                weight: 100,
              };
              axios
                .post("/edge", req, {
                  cancelToken: this.fetchCancelToken.token,
                })
                .catch(remoteErrorHandler(this.props.history))
                .then((res) => {
                  if (res) {
                    this.props.history.push({
                      pathname: "/node/" + nid,
                    });
                  }
                });
            } else {
              this.props.history.push({
                pathname: "/node/" + nid,
              });
            }
          }
        });
    }
  };

  toggleEditMode = () => {
    this.setState({ edit: !this.state.edit });
  };

  render() {
    const upd = this.state.upd.fromNow();
    const toolbar = (
      <ButtonGroup>
        <Button
          variant="outline-secondary"
          size="sm"
          disabled={this.state.edit}
          onClick={this.toggleEditMode}
        >
          &#9998;
        </Button>
        <DropdownButton
          as={ButtonGroup}
          title="&#x22EE;&nbsp;"
          id="bg-vertical-dropdown-1"
          variant="outline-secondary"
          size="sm"
        >
          <Dropdown.Item eventKey="1">&#x2602;</Dropdown.Item>
          <Dropdown.Item eventKey="2">&#x263C;</Dropdown.Item>
          <Dropdown.Item eventKey="3">&#x263D;</Dropdown.Item>
        </DropdownButton>
      </ButtonGroup>
    );

    var text_el;
    if (this.state.edit) {
      text_el = (
        <TextEditor value={this.state.text} onExit={this.onEditExit_} />
      );
    } else {
      text_el = <ReactMarkdown source={this.state.text} />;
    }
    return (
      <Card className="meta-fluid-container">
        <div className="meta-fluid-el-top-rigth">{toolbar}</div>
        <Card.Body className="p-3 m-2">
          <div className="d-flex justify-content-center mp-0">
            <Card.Img variant="top" className="w-25 p-3 m-1" src={maze} />
          </div>
          {text_el}
        </Card.Body>
        <footer className="text-right m-2">
          <small className="text-muted">
            <i>Updated {upd}</i>
          </small>
        </footer>
      </Card>
    );
  }
}

const NodeCard = withRouter(NodeCardImpl);

class FullNodeView extends React.Component {
  constructor(props) {
    super(props);
    this.fetchCancelToken = axios.CancelToken.source();
  }

  //  static propTypes = {
  //    match: PropTypes.object.isRequired,
  //    location: PropTypes.object.isRequired,
  //    history: PropTypes.object.isRequired,
  //  };

  componentDidUpdate(prevProps) {
    // Don't forget to compare props!
    if (this.props.nid !== prevProps.nid) {
      this.fetchData();
    }
  }

  componentWillUnmount() {
    this.fetchCancelToken.cancel();
  }

  componentDidMount() {
    this.fetchData();
  }

  fetchData = () => {};

  render() {
    return (
      <Container fluid>
        <Row className="d-flex justify-content-center">
          <Col xl={2} lg={3} md={3} sm={12} xs={10}>
            <CardColumns className="meta-node-refs-left">
              <RefNodeCard
                eid={1}
                nid={1}
                from_nid={2}
                ref_txt={"d"}
                key={hash.sha1("asdfasdfas")}
              />
              <RefNodeCard
                eid={1}
                nid={1}
                from_nid={2}
                ref_txt={"d"}
                key={hash.sha1("asdfasdfas")}
              />
            </CardColumns>
          </Col>
          <Col xl={4} lg={6} md={6} sm={12} xs={12}>
            <NodeCard nid={this.props.nid} />
          </Col>
          <Col xl={4} lg={3} md={3} sm={12} xs={10}>
            <NodeRefs from_nid={this.props.nid} />
          </Col>
        </Row>
      </Container>
    );
  }
}

export default withRouter(FullNodeView);
