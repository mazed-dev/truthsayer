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

import Emoji from "./Emoji";

const hash = require("object-hash");

const FormData = require("form-data");

// const Emoji = (props) => (
//   <span
//     className="emoji"
//     role="img"
//     aria-label={props.label ? props.label : ""}
//     aria-hidden={props.label ? "false" : "true"}
//   >
//     {props.symbol}
//   </span>
// );

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

  handleLinkUploads = () => {};

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
        // Reset file input
        this.fileInputRef.current.value = null;
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
          <span role="img" aria-label="status" className="mx-4 my-1">
            {status}
          </span>
          {item.filename}
        </ListGroup.Item>
      );
    });
    const link_uploads_enabled = this.state.uploads.length !== 0 && false; // Not implemented, yet
    return (
      <Container>
        <Form>
          <Form.File id="upload-notes-from-files" custom>
            <Form.File.Input
              multiple
              isValid
              onChange={this.handleChange}
              ref={this.fileInputRef}
            />
            <Form.File.Label data-browse="Button text">
              Select local files to upload...
            </Form.File.Label>
          </Form.File>
        </Form>
        <Button
          variant="secondary"
          disabled={!link_uploads_enabled}
          onClick={link_uploads_enabled ? this.handleLinkUploads : null}
          className="m-2"
        >
          Connect uploaded
        </Button>
        <ListGroup className="m-2">{uploads}</ListGroup>
      </Container>
    );
  }
}

export default withRouter(UploadFile);
