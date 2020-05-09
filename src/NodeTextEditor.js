import React from "react";

import "./NodeTextEditor.css";

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
    this.props.onChange(event.target.value);
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

class NodeText extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      edit: false,
      hover: false,
    };
  }

  handleChange = (value) => {};

  onEditStart = (_event) => {
    this.setState({ edit: true });
  };

  onEditExit_ = (value) => {
    this.setState({ edit: false });
    this.props.onChange(value);
  };

  onHover = () => {
    this.setState({ hover: true });
  };

  offHover = () => {
    this.setState({ hover: false });
  };

  render() {
    if (this.state.edit) {
      return (
        <TextEditor
          value={this.props.value}
          onExit={this.onEditExit_}
          onChange={this.handleChange}
        />
      );
    } else {
      var edit_btn = (
        <Button
          variant="outline-secondary"
          className="meta-fluid-el-top-rigth"
          size="sm"
          onClick={this.onEditStart}
        >
          &#9998;
        </Button>
      );
      return (
        <div
          className="meta-fluid-container"
          onMouseEnter={this.onHover}
          onMouseLeave={this.offHover}
        >
          <ReactMarkdown source={this.props.value} />
          {this.state.hover && edit_btn}
        </div>
      );
    }
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
      <CardColumns>
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

class NodeTextEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      text: "",
      crtd: moment(), // SystemTime,
      upd: moment(), // SystemTime,
    };
    console.log("NodeTextEditor::constructor " + props.nid);
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

  fetchData = () => {
    console.log("NodeTextEditor::fetchData " + this.props.nid);
    if (this.props.nid !== "--new--") {
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

  _onNodeChange = (value) => {
    console.log("NodeTextEditor::_onNodeChange ");
    this.setState({
      text: value,
    });
    const config = {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
      cancelToken: this.fetchCancelToken.token,
    };
    if (this.props.nid !== "--new--") {
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

  render() {
    console.log("NodeTextEditor::render " + this.props.nid);
    const upd = this.state.upd.fromNow();
    return (
      <Container fluid>
        <Row className="d-flex justify-content-center">
          <Col xl={4} lg={5} md={7}>
            <Card className="border-0">
              <Card.Body className="p-3">
                <div className="d-flex justify-content-center mp-0">
                  <Card.Img variant="top" className="w-25 p-2 m-2" src={maze} />
                </div>
                <NodeText
                  value={this.state.text}
                  onChange={this._onNodeChange}
                />
              </Card.Body>
              <footer className="text-right m-2">
                <small className="text-muted">
                  <i>Updated {upd}</i>
                </small>
              </footer>
            </Card>
          </Col>
          <Col xl={6} lg={2} md={4} sm={4}>
            <NodeRefs />
          </Col>
        </Row>
      </Container>
    );
  }
}

export default withRouter(NodeTextEditor);
