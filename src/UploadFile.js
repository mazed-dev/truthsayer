import React from "react";

// React router
import { Link, useLocation } from "react-router-dom";

import {
  Button,
  ButtonGroup,
  Card,
  CardColumns,
  Col,
  Container,
  Dropdown,
  DropdownButton,
  Form,
  InputGroup,
  Nav,
  NavDropdown,
  Navbar,
  Row,
  SplitButton,
  ListGroup,
} from "react-bootstrap";

import axios from "axios";
import queryString from "query-string";
import { withRouter } from "react-router-dom";
import remoteErrorHandler from "./remoteErrorHandler";

const hash = require("object-hash");

const FormData = require("form-data");

const Emoji = (props) => (
  <span
    className="emoji"
    role="img"
    aria-label={props.label ? props.label : ""}
    aria-hidden={props.label ? "false" : "true"}
  >
    {props.symbol}
  </span>
);

class UploadFile extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      uploads: [], // [{filename: "", nid: "", local_id: "some local id"}]
    };
    this.fileInputRef = React.createRef();
  }

  handleChange = () => {
    this.submitFiles(this.fileInputRef.current.files);
  };

  submitFiles(files) {
    let new_uploads = [];
    let data = new FormData();
    for (var i = 0; i < files.length; i++) {
      let file = files.item(i);
      let local_id = hash([file.name, Math.random()]);
      data.append(local_id, file, file.name);
      new_uploads.push({
        filename: file.name,
        local_id: local_id,
        nid: null,
      });
      this.setState({
        uploads: this.state.uploads.concat(new_uploads),
      });
    }
    const config = {
      headers: { "content-type": "multipart/form-data" },
    };
    axios
      .post("/api/batch/node", data, config)
      .then((res) => {
        if (res) {
          for (let local_id in res.data.nameToNid) {
            let uploads = this.state.uploads;
            let ind = uploads.findIndex((item) => {
              return item.local_id === local_id;
            });
            if (ind < 0) {
              continue;
            }
            uploads[ind].nid = res.data.nameToNid[local_id];
            this.setState({
              uploads: uploads,
            });
          }
        }
      })
      .catch(remoteErrorHandler(this.props.history));
  }

  render() {
    // TODO(akindyakov): Continue here
    // Connect items button
    // https://github.com/atlassian/react-beautiful-dnd
    const uploads = this.state.uploads.map((item) => {
      var status = <Emoji symbol="⌛" label="upload in progress" />;
      if (item.nid !== null) {
        status = <Emoji symbol="🌱" label="uploaded" />;
      }
      return (
        <ListGroup.Item key={item.local_id}>
          {item.filename}
          ::
          <span role="img" aria-label="status">
            {status}
          </span>
        </ListGroup.Item>
      );
    });
    return (
      <Container>
        <Form>
          <Form.File id="formcheck-api-regular">
            <Form.File.Input
              multiple
              isInvalid
              onChange={this.handleChange}
              ref={this.fileInputRef}
            />
          </Form.File>
        </Form>
        <ListGroup className="m-2">{uploads}</ListGroup>
      </Container>
    );
  }
}

export default withRouter(UploadFile);
