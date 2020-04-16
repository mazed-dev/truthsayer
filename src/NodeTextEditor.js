import React from 'react';

import maze from './maze.png';

import {Card, Button, InputGroup, FormControl, Container} from 'react-bootstrap';

class TitleEditor extends React.Component {
    constructor(props) {
      super(props);
      this.state = {value: ''};
      this.handleChange = this.handleChange.bind(this);
      this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
      this.setState({value: event.target.value});
    }

    handleSubmit(event) {
      alert('A name was submitted: ' + this.state.value);
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
          />
          </InputGroup>
      );
    }
}

class TextEditor extends React.Component {
    constructor(props) {
      super(props);
      this.state = {value: ''};
      this.handleChange = this.handleChange.bind(this);
      this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
      this.setState({value: event.target.value});
    }

    handleSubmit(event) {
      alert('A name was submitted: ' + this.state.value);
      event.preventDefault();
    }

    render() {
      // <textarea name="text" value={this.state.value} onChange={this.handleChange} />
      return (
        <InputGroup>
          <FormControl as="textarea" aria-label="With textarea" value={this.state.value} onChange={this.handleChange} />
        </InputGroup>
      );
    }
}

class NodeTextEditor extends React.Component {
    constructor(props) {
      super(props);
      this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit(event) {
      alert('A form was submitted: ');
      event.preventDefault();
    }

    render() {
      return (
        <Container>
        <Card>
          <Card.Img variant="top" src={maze} />
            <TitleEditor />
            <TextEditor />
            <Button variant="outline-secondary">Button</Button>
        </Card>
        </Container>
      );
        // <form onSubmit={this.handleSubmit}>
        //   <input type="submit" value="Submit" />
        // </form>
    }
}

export default NodeTextEditor;
