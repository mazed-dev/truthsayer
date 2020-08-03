import React from "react";

import {
  Modal,
  Button,
  Container,
  Card,
  Form,
  ListGroup,
} from "react-bootstrap";

import keycode from "keycode";

import "./AutocompleteWindow.css";

class AutocompleteModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      input: "",
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
    const { cursor, result } = this.state;
    // arrow up/down button should select next/previous list element
    if (e.keyCode === keycode.UP && cursor > 0) {
      this.setState((prevState) => ({
        cursor: prevState.cursor - 1,
      }));
    } else if (e.keyCode === keycode.DOWN && cursor < result.length - 1) {
      this.setState((prevState) => ({
        cursor: prevState.cursor + 1,
      }));
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
          <ListGroup.Item as="li" active>
            Cras justo odio
          </ListGroup.Item>
          <ListGroup.Item as="li">Dapibus ac facilisis in</ListGroup.Item>
          <ListGroup.Item as="li" disabled>
            Morbi leo risus
          </ListGroup.Item>
          <ListGroup.Item as="li">Porta ac consectetur ac</ListGroup.Item>
          <ListGroup.Item as="li">Porta ac consectetur ac</ListGroup.Item>
          <ListGroup.Item as="li">Porta ac consectetur ac</ListGroup.Item>
          <ListGroup.Item as="li">Porta ac consectetur ac</ListGroup.Item>
          <ListGroup.Item as="li">Porta ac consectetur ac</ListGroup.Item>
          <ListGroup.Item as="li">Porta ac consectetur ac</ListGroup.Item>
          <ListGroup.Item as="li">Porta ac consectetur ac</ListGroup.Item>
          <ListGroup.Item as="li">Porta ac consectetur ac</ListGroup.Item>
          <ListGroup.Item as="li">Porta ac consectetur ac</ListGroup.Item>
          <ListGroup.Item as="li">Porta ac consectetur ac</ListGroup.Item>
          <ListGroup.Item as="li">Porta ac consectetur ac</ListGroup.Item>
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
