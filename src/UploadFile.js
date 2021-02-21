import React from "react";

import { Button, Container, Form, ListGroup } from "react-bootstrap";

import PropTypes from "prop-types";
import axios from "axios";
import { Link, withRouter } from "react-router-dom";

import Emoji from "./Emoji";

import { smugler } from "./smugler/api";

import styles from "./UploadFile.module.css";

const uuid = require("uuid");

class UploadFile extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      uploads: [], // [{filename: "", nid: "", local_id: "some local id", progress: 1.0, err_message: null}]
    };
    this.fileInputRef = React.createRef();
    this.fetchCancelToken = axios.CancelToken.source();
  }

  static propTypes = {
    history: PropTypes.object.isRequired,
  };

  handleChange = () => {
    this.submitFilesWithAttrs(this.fileInputRef.current.files);
  };

  handleLinkUploads = () => {};

  submitFilesWithAttrs = (files) => {
    let new_uploads = [];
    for (var i = 0; i < files.length; i++) {
      const file = files.item(i);
      const localId = uuid.v4();
      new_uploads.push({
        filename: file.name,
        local_id: localId,
        nid: null,
        progress: 0.0,
      });
      this.submitOneFile(file, localId);
    }
    this.setState({
      uploads: this.state.uploads.concat(new_uploads),
    });
  };

  submitOneFile = (file, localId) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      //*dbg*/ console.log("Loaded to memory", event);
      const appendix =
        '\n---\n*From file - "' +
        file.name +
        '" (`' +
        Math.round((file.size * 100) / 1024) * 100 +
        "KiB`)*\n";
      smugler.node
        .create({
          text: event.target.result + appendix,
          cancelToken: this.fetchCancelToken.token,
        })
        .then((node) => {
          if (node) {
            const nid = node.nid;
            this.updateFileStatus(localId, {
              nid: nid,
              progress: 1.0,
            });
          }
        })
        .catch((err) => {
          this.updateFileStatus(localId, {
            err_message: "Submission failed: " + err,
          });
        });
    };

    reader.onerror = (event) => {
      this.updateFileStatus(localId, {
        err_message: "reading failed: " + reader.error,
      });
    };

    reader.onprogress = (event) => {
      if (event.loaded && event.total) {
        const percent = (event.loaded / event.total) * 0.5;
        this.updateFileStatus(localId, { progress: percent });
      }
    };

    // TODO(akindyakov) fix this for other file types, e.g. images.
    // https://developer.mozilla.org/en-US/docs/Web/API/FileReader/result
    reader.readAsText(file);
  };

  updateFileStatus = (localId, upd) => {
    this.setState((state) => {
      var uploads = this.state.uploads;
      const ind = uploads.findIndex((item) => {
        return item.local_id === localId;
      });
      if (!(ind < 0)) {
        Object.assign(uploads[ind], upd);
        return {
          uploads: uploads,
        };
      }
      return {};
    });
  };

  render() {
    // TODO(akindyakov): Continue here
    // Connect items button
    // https://github.com/atlassian/react-beautiful-dnd
    const uploads = this.state.uploads.map((item) => {
      var status = <Emoji symbol="⌛" label="upload in progress" />;
      var name = item.filename;
      if (item.nid !== null) {
        status = <Emoji symbol="✅" label="uploaded" />;
        name = <Link to={"/n/" + item.nid}>{name}</Link>;
      }
      var msg = Math.round(item.progress * 100) + "%";
      if (item.err_message) {
        status = <Emoji symbol="❌" label="failed" />;
        msg = item.err_message;
      }
      return (
        <li key={item.local_id}>
          <ListGroup horizontal="sm" className={styles.files_list_item_group}>
            <ListGroup.Item>
              <span role="img" aria-label="status">
                {status}
              </span>
            </ListGroup.Item>
            <ListGroup.Item>{msg}</ListGroup.Item>
            <ListGroup.Item>{name}</ListGroup.Item>
          </ListGroup>
        </li>
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
        <ul className={styles.files_list}>{uploads}</ul>
      </Container>
    );
  }
}

export default withRouter(UploadFile);
