import React from "react";

import { Modal, Button, Container, Card, Form } from "react-bootstrap";

import "./AutocompleteWindow.css";

class AutocompleteModal extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Container className="autocomplete-window-top">
        <Card>
          <Card.Body>
            <Card.Title>To be done</Card.Title>
            <Card.Text>To be done</Card.Text>
          </Card.Body>
        </Card>
      </Container>
    );
  }
}

class AutocompleteWindow extends React.Component {
  constructor(props) {
    super(props);
    console.log("AutocompleteWindow ", this.props.show);
    this.state = {
      input: "",
    };
    this.inputRef = React.createRef();
  }

  onEntered = () => {
    console.log("On entered", this.inputRef.current);
    this.inputRef.current.focus();
  }

  handleChange = (event) => {
  };

  handleSumbit = (event) => {
  };

  render() {
      // dialogAs={AutocompleteModal}
      // backdrop={false}
      // autoFocus={true}
    return (<Modal
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
      <Form.Control
        aria-label="Search-to-link"
        aria-describedby="basic-addon1"
        onChange={this.handleChange}
        onSubmit={this.handleSumbit}
        value={this.state.input}
        placeholder="Search to offer"
        ref={this.inputRef}
      />
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          Modal heading
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <h4>Centered Modal</h4>
        <p>
          Cras mattis consectetur purus sit amet fermentum. Cras justo odio,
          dapibus ac facilisis in, egestas eget quam. Morbi leo risus, porta ac
          consectetur ac, vestibulum at eros.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={this.props.onHide}>Close</Button>
      </Modal.Footer>
    </Modal>);
  }
}

function App() {
  const [modalShow, setModalShow] = React.useState(false);
  return (
    <>
      <Button variant="primary" onClick={() => setModalShow(true)}>
        Launch vertically centered modal
      </Button>

      <AutocompleteWindow
        show={modalShow}
        onHide={() => setModalShow(false)}
      />
    </>
  );
}

export default AutocompleteWindow;
