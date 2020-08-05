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

class AutocompleteModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      input: "",
      result: [
        "Tip of my tongue: Word that means cultural identifier",
        "Customization of memory class C++",
        "Is one move considered as objectively better than another if they both lead to the same result?",
        "error404 on 2nd booking event page",
        "When was the first intentional ricochet fired from a naval artillery?",
        "Why do helicopters have windows near the pedals?",
        "Is it feasible to add an aftermarket hydrofoil to a light aircraft?",
        "Would a President get to fill a Supreme Court vacancy just after he lost an election in November/December?",
        "RandomPoint fails for any higher dimension",
        "In an interview with a small video game company, should I comment about bugs I noticed in their game?",
        "Why is the A380's fuselage designed with a flat bottom?",
        "Is there an equivalent of computation of physical processes in nature?",
        "Windows Storage Spaces - a useful replacement for RAID6?",
        "Do blue light filters on phones and computer screens disrupt sleep?",
        "What is the relationship between communism and 'a classless system'?",
        "In command-line, custom text and background colors by directory",
        "Sort an output by year month and date",
        "Clarifying Share Alike in CC licenses",
        "Why has Raspbian apparently been renamed into Raspberry Pi OS?",
        "Can I share folders on a LAN using NTFS alone?",
        "Water at the scale of a cell should feel more like tar?",
        "Should I publish everything running on Linux under GPL?",
        "Why is Elon Musk building the Starship first?",
        "Difference between a pointer to a standalone and a friend function",
      ],
      cursor: 0,
    };
    this.inputRef = React.createRef();
  }

  componentDidMount() {
    console.log("AutocompleteWindow ", this.props.show);
    this.inputRef.current.focus();
  }

  handleChange = (event) => {
    console.log("AutocompleteModal input change ", event.target);
    this.setState({
      input: event.target.value,
    });
  };

  handleSumbit = (event) => {};

  handleKeyDown = (e) => {
    // https://stackoverflow.com/questions/42036865/react-how-to-navigate-through-list-by-arrow-keys
    // arrow up/down button should select next/previous list element
    if (e.keyCode === keycode("up")) {
      this.setState((state, props) => {
        return { cursor: state.cursor - (state.cursor > 0 ? 1 : 0) };
      });
    } else if (e.keyCode === keycode("down")) {
      this.setState((state, props) => {
        const maxL = state.result.length > 0 ? state.result.length - 1 : 0;
        return { cursor: state.cursor >= maxL ? maxL : state.cursor + 1 };
      });
    }
  };

  render() {
    // <Modal.Header closeButton>
    //   <Modal.Title id="contained-modal-title-vcenter">
    //     Modal heading
    //   </Modal.Title>
    // </Modal.Header>
    // <Modal.Body>
    //   <p>
    //     Cras mattis consectetur purus sit amet fermentum. Cras justo odio,
    //     dapibus ac facilisis in, egestas eget quam. Morbi leo risus, porta ac
    //     consectetur ac, vestibulum at eros.
    //   </p>
    // </Modal.Body>
    // <Modal.Footer>
    //   <Button onClick={this.props.onHide}>Close</Button>
    // </Modal.Footer>
    const listItems = this.state.result.map((item, index) => {
      const isActive = this.state.cursor === index;
      return (
        <ListGroup.Item as="li" active={isActive} key={index}>
          <SmartLine item={item} />
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
