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
    var toolbar;
    const title_el = (
      <Button variant="outline-danger" size="sm">
        {this.state.title}
      </Button>
    );
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
          <div>
            {title_el}
            <ButtonGroup>
              <Button variant="secondary" size="sm">
                &#9998;
              </Button>
              <Button variant="secondary" size="sm">
                &#9988;
              </Button>
              <DropdownButton
                as={ButtonGroup}
                title="&hellip;"
                id="bg-vertical-dropdown-1"
                variant="secondary"
                size="sm"
              >
                <Dropdown.Item eventKey="1">H1</Dropdown.Item>
                <Dropdown.Item eventKey="2">H2</Dropdown.Item>
                <Dropdown.Item eventKey="3">H3</Dropdown.Item>
              </DropdownButton>
            </ButtonGroup>
          </div>
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
        <div className="meta-fluid-element">{toolbar}</div>
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
    this.state = { value: "" };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({ value: event.target.value });
  }

  handleSubmit(event) {
    alert("A name was submitted: " + this.state.value);
    event.preventDefault();
  }

  render() {
    // <div>
    //   <input type="text" value={this.state.value} onChange={this.handleChange} />
    // </div>
    // <InputGroup.Prepend>
    //   <InputGroup.Text>Title</InputGroup.Text>
    // </InputGroup.Prepend>
    return (
      <InputGroup>
        <FormControl
          placeholder="Title"
          aria-label="Title"
          value={this.state.value}
          onChange={this.handleChange}
          className="border-0"
        />
      </InputGroup>
    );
  }
}

class TextEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: "",
      height: 12,
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    const height = (event.target.value.match(/\n/g) || "").length + 2;
    this.setState({
      value: event.target.value,
      height: Math.max(12, height * 1.6),
    });
  }

  handleSubmit(event) {
    alert("A name was submitted: " + this.state.value);
    event.preventDefault();
  }

  render() {
    // <textarea name="text" value={this.state.value} onChange={this.handleChange} />
    return (
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
    );
  }
}

class MarkdownToolBar extends React.Component {
  render() {
    return (
      <ButtonGroup vertical>
        <Button variant="light">&#9998;</Button>
        <Button variant="light">&#128279;</Button>
        <Button variant="light">URL</Button>
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
    //style={{ width: '640px' }}
    return (
      <Container fluid>
        <Row className="d-flex justify-content-center">
          <Col xl={0} lg={0} md={0} xl={0}>
            <MarkdownToolBar />
          </Col>
          <Col xl={5} lg={5} md={7}>
            <Card className="border-0">
              <div className="d-flex justify-content-center mp-0">
                <Card.Img variant="top" className="w-25 p-3" src={maze} />
              </div>
              <TitleEditor />
              <TextEditor />
              <Button variant="outline-secondary">Button</Button>
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
