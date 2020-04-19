import React from "react";

import "./NodeTextEditor.css";

import maze from "./maze.png";

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
  Popover,
  OverlayTrigger,
} from "react-bootstrap";

class RefNodeCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = { title: this.props.title, hover: false };
    this.toggleHover = this.toggleHover.bind(this);
  }

  toggleHover() {
    this.setState({ hover: !this.state.hover });
  }

  render() {
    const title_el = (
      <Button variant="outline-danger" size="sm">
        {this.state.title}
      </Button>
    );
    var toolbar;
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
      } else {
        toolbar = title_el;
      }
    }
    return (
      <Card
        className="rounded"
        onMouseEnter={this.toggleHover}
        onMouseLeave={this.toggleHover}
      >
        <div className="meta-fluid-el-top-left">{toolbar}</div>
        <Card.Body className="p-3 m-0">
          <div className="d-flex justify-content-center">
            <Card.Img variant="top" className="w-25 p-0 m-2" src={maze} />
          </div>
          <Card.Title>Card Title</Card.Title>
          <Card.Text>
            Some quick example text to build on the card title and make up the
            bulk of the card's content.
          </Card.Text>
        </Card.Body>
      </Card>
    );
  }
}

RefNodeCard.defaultProps = { offer: false, title: "..." };

class TitleEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: this.props.value,
      edit: false,
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleEditClick = this.handleEditClick.bind(this);
  }

  handleChange(event) {
    this.setState({ value: event.target.value });
  }

  handleEditClick(_event) {
    this.setState({ edit: !this.state.edit });
  }

  handleSubmit(event) {
    alert("A name was submitted: " + this.state.value);
    event.preventDefault();
  }

  render() {
    if (this.state.edit) {
      return (
        <InputGroup>
          <FormControl
            placeholder="Title"
            aria-label="Title"
            value={this.state.value}
            onChange={this.handleChange}
          />
          <InputGroup.Append>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={this.handleEditClick}
            >
              &#x2713;
            </Button>
          </InputGroup.Append>
        </InputGroup>
      );
    } else {
      return (
        <div className="meta-fluid-container">
          <Card.Title>{this.state.value}</Card.Title>
          <Button
            variant="outline-secondary"
            className="meta-fluid-el-top-rigth"
            size="sm"
            onClick={this.handleEditClick}
          >
            &#9998;
          </Button>
        </div>
      );
    }
  }
}

TitleEditor.defaultProps = {
  value: "San Diego Comic-Con is canceled for the first time in 50 years",
};

class TextEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value:
        "Comic-Con, often referred to as SDCC, was scheduled to run from July 23 rd d d through July 26th. People who have already purchased badges for the convention will have the opportunity to either request a full refund or transfer their badges to Comic-Con 2021, according to the organizers. Those who booked hotels via onPeak, the service used in partnership with SDCC, will also see their deposits refunded.",
      height: 12,
      edit: false,
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleEditClick = this.handleEditClick.bind(this);
  }

  handleChange(event) {
    // FIXME
    var lines = 2;
    event.target.value.split("\n").forEach(function (item, index) {
      lines = lines + 1 + item.length / 80;
    });
    this.setState({
      value: event.target.value,
      height: Math.max(12, lines * 1.5),
    });
  }

  handleSubmit(event) {
    alert("A name was submitted: " + this.state.value);
    event.preventDefault();
  }

  handleEditClick(_event) {
    this.setState({ edit: !this.state.edit });
  }

  render() {
    if (this.state.edit) {
      const popover = (
        <Popover id="popover-markdown-toolbar">
          <MarkdownToolBar />
        </Popover>
      );
      return (
        <OverlayTrigger trigger="focus" placement="left" overlay={popover}>
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
        </OverlayTrigger>
      );
    } else {
      return (
        <Card.Text>
          <div className="meta-fluid-container">
            {this.state.value}
            <Button
              variant="outline-secondary"
              className="meta-fluid-el-bottom-rigth"
              size="sm"
              onClick={this.handleEditClick}
            >
              &#9998;
            </Button>
          </div>
        </Card.Text>
      );
    }
  }
}

class MarkdownToolBar extends React.Component {
  render() {
    return (
      <ButtonGroup vertical>
        <Button variant="light">
          <span role="img" aria-label="Link">
            &#128279;
          </span>
        </Button>
        <Button variant="light">&#x2381;</Button>
        <Button variant="light">H2</Button>
        <Button variant="light">H3</Button>
        <DropdownButton
          as={ButtonGroup}
          title="H2"
          id="bg-vertical-dropdown-1"
          variant="light"
        >
          <Dropdown.Item eventKey="1">H1</Dropdown.Item>
          <Dropdown.Item eventKey="2">H2</Dropdown.Item>
          <Dropdown.Item eventKey="3">H3</Dropdown.Item>
        </DropdownButton>
      </ButtonGroup>
    );
  }
}

class NodeTextEditor extends React.Component {
  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(event) {
    alert("A form was submitted: ");
    event.preventDefault();
  }

  render() {
    // <Col xl={0} lg={0} md={0} xl={0}>
    //   <MarkdownToolBar />
    // </Col>
    return (
      <Container fluid>
        <Row className="d-flex justify-content-center">
          <Col xl={4} lg={5} md={7}>
            <Card className="border-0">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-center mp-0">
                  <Card.Img variant="top" className="w-25 p-3" src={maze} />
                </div>
                <TitleEditor />
                <TextEditor />
                <Card.Text className="text-right">
                  <small className="text-muted">Last updated 3 mins ago</small>
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col xl={6} lg={2} md={4} sm={4}>
            <CardColumns>
              <RefNodeCard offer={true} />
              <RefNodeCard offer={true} title={"Ref"} />
              <RefNodeCard title={"Next"} />
              <RefNodeCard title={"Data"} />
              <RefNodeCard title={"Link"} />
              <RefNodeCard title={"Any of the available button style"} />
              <RefNodeCard title={"Source"} />
              <RefNodeCard title={"Ref"} />
              <RefNodeCard title={"Ref"} />
              <RefNodeCard title={"Ref"} />
              <RefNodeCard title={"Ref"} />
              <RefNodeCard title={"Ref"} />
            </CardColumns>
          </Col>
        </Row>
      </Container>
    );
    // <form onSubmit={this.handleSubmit}>
    //   <input type="submit" value="Submit" />
    // </form>
  }
}

export default NodeTextEditor;
