import React from "react";

import {
  BrowserRouter as Router,
  Link,
  Redirect,
  Route,
  Switch,
  useLocation,
  useParams,
} from "react-router-dom";

import {
  Card,
  Button,
  Container,
  ButtonGroup,
  ListGroup,
  InputGroup,
  FormControl,
  Popover,
  OverlayTrigger,
} from "react-bootstrap";

import "./LeftToolbar.css";
import queryString from "query-string";

class SearchTool extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: "",
    };
    this.searchCmd = React.createRef();
  }

  componentDidMount() {
    if (this.props.inFocus) {
      this.searchCmd.current.focus();
    }
  }

  handleChange = (event) => {
    this.setState({ value: event.target.value });
    // if (this.props.callback !== null) {
    //   this.props.callback(event.target.value);
    // } else {
    //   this.props.history.push({
    //     pathname: "/search",
    //     search: queryString.stringify({ q: event.target.value }),
    //   });
    // }
  };

  render() {
    return (
      <Container className="mt-2 mb-2">
        <InputGroup className="mb-3 mt-1" size="sm">
          <FormControl
            aria-label="Search"
            onChange={this.handleChange}
            value={this.state.value}
            ref={this.searchCmd}
          />
          <InputGroup.Append>
            <span role="img" aria-label="Search">
              &#x1F50D;
            </span>
          </InputGroup.Append>
        </InputGroup>
      </Container>
    );
  }
}

function LeftToolbar() {
  return (
    <>
      <div className="meta-left-toolbar">
        <ListGroup variant="flush">
          <ListGroup.Item as={Link} to="/">
            &#x1F50D;
          </ListGroup.Item>
          <ListGroup.Item as={Link} to="/thread">
            thread
          </ListGroup.Item>
          <ListGroup.Item as={Link} to="/logout">
            logout
          </ListGroup.Item>
          <ListGroup.Item as={Link} to="/account">
            account
          </ListGroup.Item>
          <ListGroup.Item as={Link} to="/about">
            about
          </ListGroup.Item>
          <ListGroup.Item as={Link} to="/node/id">
            node
          </ListGroup.Item>
          <ListGroup.Item as={Link} to="/node/--new--">
            new
          </ListGroup.Item>
          <ListGroup.Item as={Link} to="/login">
            login
          </ListGroup.Item>
          <ListGroup.Item as={Link} to="/signin">
            signin
          </ListGroup.Item>
        </ListGroup>
      </div>
    </>
  );
}

export default LeftToolbar;
