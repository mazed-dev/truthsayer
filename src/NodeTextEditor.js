import React from 'react';

import maze from './maze.png';

import {Card, Button, InputGroup, FormControl, Container, Row, Col, CardColumns} from 'react-bootstrap';

      // <Card style={{ width: '25rem' }}>
function RefNodeCard() {
  return (
      <Card >
        <Card.Body className="m-0">
          <div className="d-flex justify-content-center">
            <Card.Img variant="top" className="w-50 p-0 m-2" src={maze} />
          </div>
          <Card.Title>Card Title</Card.Title>
          <Card.Text>
            Some quick example text to build on the card title and make up the bulk of the card's content.
          </Card.Text>
          <Button variant="outline-secondary">See</Button>
        </Card.Body>
      </Card>
  )
}

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
        value: '',
        height: 12,
      };
      this.handleChange = this.handleChange.bind(this);
      this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
      const height = (event.target.value.match(/\n/g) || '').length + 2;
      this.setState({
        value: event.target.value,
        height: Math.max(12, height * 1.6),
      });
    }

    handleSubmit(event) {
      alert('A name was submitted: ' + this.state.value);
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
            style={{ height: this.state.height + 'em' }}
          />
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
      //style={{ width: '640px' }}
      return (
        <Container fluid>
          <Row className="d-flex justify-content-center">
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
            <Col xl={5} lg={2} md={4} sm={4}>
              <CardColumns>
                <RefNodeCard />
                <RefNodeCard />
                <RefNodeCard />
                <RefNodeCard />
                <RefNodeCard />
                <RefNodeCard />
                <RefNodeCard />
                <RefNodeCard />
                <RefNodeCard />
                <RefNodeCard />
                <RefNodeCard />
                <RefNodeCard />
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
