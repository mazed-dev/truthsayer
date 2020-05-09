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
  FormControl,
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

class RefNodeCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = { ref_txt: this.props.ref_txt, hover: false };
  }

  onHover = () => {
    this.setState({ hover: true });
  };

  offHover = () => {
    this.setState({ hover: false });
  };

  render() {
    const title_el = (
      <Button variant="outline-danger" size="sm">
        {this.state.ref_txt}
      </Button>
    );
    var toolbar = title_el;
    if (this.props.offer) {
      toolbar = (
        <ButtonGroup>
          <Button variant="outline-success" size="sm">
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
        <NodeSmallCard />
        <div className="meta-fluid-el-top-left">{toolbar}</div>
      </div>
    );
  }
}

RefNodeCard.defaultProps = { offer: false, ref_txt: "..." };

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
          <FormControl
            as="textarea"
            aria-label="With textarea"
            className="border-0"
            value={this.state.value}
            onChange={this.handleChange}
            style={{ height: this.state.height + "em" }}
          />
        </InputGroup>
      </ExtClickDetector>
    );
  }
}

// class MarkdownToolBar extends React.Component {
//   render() {
//     return (
//       <ButtonGroup vertical>
//         <Button variant="light">
//           <span role="img" aria-label="Link">
//             &#128279;
//           </span>
//         </Button>
//         <Button variant="light">&#x2381;</Button>
//         <Button variant="light">H2</Button>
//         <Button variant="light">H3</Button>
//         <DropdownButton
//           as={ButtonGroup}
//           title="H2"
//           id="bg-vertical-dropdown-1"
//           variant="light"
//         >
//           <Dropdown.Item eventKey="1">H1</Dropdown.Item>
//           <Dropdown.Item eventKey="2">H2</Dropdown.Item>
//           <Dropdown.Item eventKey="3">H3</Dropdown.Item>
//         </DropdownButton>
//       </ButtonGroup>
//     );
//   }
// }

class NodeRefs extends React.Component {
  render() {
    return (
      <CardColumns className="meta-node-refs">
        <RefNodeCard offer={true} />
        <RefNodeCard offer={true} title={"Ref"} />
        <RefNodeCard ref_txt={"Next"} />
        <RefNodeCard ref_txt={"Data"} />
        <RefNodeCard ref_txt={"Link"} />
        <RefNodeCard ref_txt={"Any of the available button style"} />
        <RefNodeCard ref_txt={"Source"} />
        <RefNodeCard ref_txt={"Ref"} />
        <RefNodeCard ref_txt={"Ref"} />
        <RefNodeCard ref_txt={"Ref"} />
        <RefNodeCard ref_txt={"Ref"} />
        <RefNodeCard ref_txt={"Ref"} />
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
      edit: false,
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
    this.fetchCancelToken.cancel("Operation canceled by the user.");
  }

  componentDidMount() {
    this.fetchData();
  }

  isNew() {
    console.log("Is new " + this.props.nid);
    return this.props.nid === "--new--";
  }

  fetchData = () => {
    console.log("FullNodeView::fetchData " + this.props.nid);
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
            this.props.history.push({
              pathname: "/node/" + res.data.nid,
            });
          }
        });
    }
  };

  toggleEditMode = () => {
    this.setState({ edit: !this.state.edit });
  };

  render() {
    console.log("FullNodeView::render " + this.props.nid);
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
        <Card.Body className="p-3">
          <div className="d-flex justify-content-center mp-0">
            <Card.Img variant="top" className="w-25 p-2 m-2" src={maze} />
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
    this.fetchCancelToken.cancel("Operation canceled by the user.");
  }

  componentDidMount() {
    this.fetchData();
  }

  fetchData = () => {};

  render() {
    return (
      <Container fluid>
        <Row className="d-flex justify-content-center">
          <Col xl={4} lg={6} md={8} sm={12} xs={12}>
            <NodeCard nid={this.props.nid} />
          </Col>
          <Col xl={6} lg={6} md={4} sm={8} xs={10}>
            <NodeRefs />
          </Col>
        </Row>
      </Container>
    );
  }
}

export default withRouter(FullNodeView);
