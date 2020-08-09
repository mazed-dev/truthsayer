import React from "react";

import {
  Modal,
  Button,
  Container,
  Card,
  Form,
  ListGroup,
  Row,
  Col,
} from "react-bootstrap";

import keycode from "keycode";

import SmartLine from "./smartpoint/SmartLine";

import "./AutocompleteWindow.css";

const emoji = require("node-emoji");

class SmartLineReplaceText extends React.Component {
  constructor(props) {
    super(props);
    // {this.props.replacement}
  }

  render() {
    return (
      <Row className="justify-content-between w-100 p-0 m-0">
        <Col sm md lg xl={8}>
          {this.props.children}
        </Col>
        <Col sm md lg xl={2}>
          <Button variant="outline-success" size="sm">
            Insert
          </Button>
        </Col>
      </Row>
    );
  }
}

class AutocompleteModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      input: "",
      result: [
        // "Tip of my tongue: Word that means cultural identifier",
        // "Customization of memory class C++",
        // "Is one move considered as objectively better than another if they both lead to the same result?",
        // "error404 on 2nd booking event page",
        // "When was the first intentional ricochet fired from a naval artillery?",
        // "Why do helicopters have windows near the pedals?",
        // "Is it feasible to add an aftermarket hydrofoil to a light aircraft?",
        // "Would a President get to fill a Supreme Court vacancy just after he lost an election in November/December?",
        // "RandomPoint fails for any higher dimension",
        // "In an interview with a small video game company, should I comment about bugs I noticed in their game?",
        // "Why is the A380's fuselage designed with a flat bottom?",
        // "Is there an equivalent of computation of physical processes in nature?",
        // "Windows Storage Spaces - a useful replacement for RAID6?",
        // "Do blue light filters on phones and computer screens disrupt sleep?",
        // "What is the relationship between communism and 'a classless system'?",
        // "In command-line, custom text and background colors by directory",
        // "Sort an output by year month and date",
        // "Clarifying Share Alike in CC licenses",
        // "Why has Raspbian apparently been renamed into Raspberry Pi OS?",
        // "Can I share folders on a LAN using NTFS alone?",
        // "Water at the scale of a cell should feel more like tar?",
        // "Should I publish everything running on Linux under GPL?",
        // "Why is Elon Musk building the Starship first?",
        // "Difference between a pointer to a standalone and a friend function",
        // <SmartLine item={item} />
      ],
      cursor: 0,
    };
    this.inputRef = React.createRef();
  }

  componentDidMount() {
    this.inputRef.current.focus();
  }

  emojiSearch = async function (input) {
    const items = emoji.search(input).map((item) => {
      return (
        <SmartLineReplaceText replacement={item.emoji}>
          <b>{item.emoji}</b>
          &nbsp;
          <i>{item.key}</i>
        </SmartLineReplaceText>
      );
    });
    this.setState((state) => {
      return {
        result: state.result.concat(items),
      };
    });
  };

  handleChange = (event) => {
    this.setState({
      input: event.target.value,
      result: [],
    });
    if (event.target.value) {
      this.emojiSearch(event.target.value);
    }
  };

  handleSumbit = (event) => {};

  handleReplaceInsert = (replacement) => {
    console.log("handleReplaceInsert", this.props.text_area_ref.current);
  };

  handleKeyDown = (e) => {
    // https://stackoverflow.com/questions/42036865/react-how-to-navigate-through-list-by-arrow-keys
    // arrow up/down button should select next/previous list element
    console.log("Key down", e.keyCode, keycode);
    if (e.keyCode === keycode("up")) {
      e.preventDefault();
      this.setState((state, props) => {
        return { cursor: state.cursor - (state.cursor > 0 ? 1 : 0) };
      });
    } else if (e.keyCode === keycode("down") || e.keyCode === keycode("tab")) {
      e.preventDefault();
      this.setState((state, props) => {
        const maxL = state.result.length > 0 ? state.result.length - 1 : 0;
        return { cursor: state.cursor >= maxL ? maxL : state.cursor + 1 };
      });
    }
  };

  render() {
    const listItems = this.state.result.map((item, index) => {
      const isActive = this.state.cursor === index;
      return (
        <ListGroup.Item as="li" active={isActive} key={index} className="p-1">
          {item}
        </ListGroup.Item>
      );
    });
    return (
      <>
        <Form.Control
          aria-label="Search-to-link"
          aria-describedby="basic-addon1"
          onChange={this.handleChange}
          onSubmit={this.handleSumbit}
          onKeyDown={this.handleKeyDown}
          value={this.state.input}
          placeholder="Search to offer"
          ref={this.inputRef}
        />
        <ListGroup as="ul" className="autocomplete-window-list-group">
          {listItems}
        </ListGroup>
      </>
    );
  }
}

class AutocompleteWindow extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    // dialogAs={AutocompleteModal}
    // backdrop={false}
    // autoFocus={true}
    return (
      <Modal
        {...this.props}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        keyboard={true}
        restoreFocus={false}
        animation={false}
        dialogClassName="autocomplete-window-top"
        scrollable={true}
        enforceFocus={true}
        onShow={this.onEntered}
      >
        <AutocompleteModal />
      </Modal>
    );
  }
}

export default AutocompleteWindow;
