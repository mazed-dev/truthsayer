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
} from "react-bootstrap";

import axios from "axios";
import queryString from "query-string";
import { withRouter } from "react-router-dom";

const FormData = require("form-data");

class UploadFile extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      uploaded_nids: [],
    };
    this.fileInputRef = React.createRef();
  }

  handleChange = () => {
    console.log("Change", this.fileInputRef.current.files);
    this.submitFiles(this.fileInputRef.current.files);
  };

  submitFiles(files) {
    let data = new FormData();
    for (var i = 0; i < files.length; i++) {
      let file = files.item(i);
      data.append(i, file, file.name);
    }
    const config = {
      headers: { "content-type": "multipart/form-data" },
    };
    axios.post("/api/batch/node", data, config).then((res) => {
      console.log("Test response", res);
    });
  }

  render() {
    // TODO(akindyakov): Continue here
    const rows = this.state.uploaded_nids.map((nid) => {
      return (<Row className="m-4">
        <Col>
          <p>File</p>
        </Col>
        <Col>
          <p>frst</p>
        </Col>
        <Col>
          <p>second</p>
        </Col>
      </Row>);
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
        {rows}
      </Container>
    );
  }
}

export default withRouter(UploadFile);
