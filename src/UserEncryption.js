import React from "react";

// React router
import { Link } from "react-router-dom";

import {
  InputGroup,
  Form,
  Button,
  ButtonGroup,
  Container,
  Image,
  ListGroup,
  Card,
  Row,
  Col,
} from "react-bootstrap";

import axios from "axios";
import { withRouter } from "react-router-dom";

import { LocalCrypto } from "./crypto/local.jsx";

import { joinClasses } from "./util/elClass.js";

import Emoji from "./Emoji.js";

import styles from "./UserEncryption.module.css";

import KeyImg from "./crypto/img/yellow_key.png";

class UserEncryption extends React.Component {
  constructor(props) {
    super(props);
    this.axiosCancelToken = axios.CancelToken.source();
    this.state = {
      intput: "",
      reveal: false,
    };
  }

  componentDidMount() {}

  componentWillUnmount() {
    this.axiosCancelToken.cancel();
  }

  handleToggleReveal = () => {
    this.setState((state) => {
      return { reveal: !state.reveal };
    });
  };

  handleChange = (event) => {
    const input = event.target.value;
    const ref = event.target;
    this.setState({
      input: input,
      height: this.getAdjustedHeight(ref, 42),
    });
  };

  handleSubmitSecret = () => {
    const account = this.props.account;
    const crypto = account == null ? null : account.getLocalCrypto();
    console.log("Submit...", crypto);
    if (crypto != null) {
      console.log("Crypto is initialised");
      const secretPhrase = this.state.input;
      crypto.appendSecret(secretPhrase).then((id) => {
        console.log("Secret added", id);
        this.forceUpdate();
      });
    }
  };

  handleDeleteSecret = () => {
    const account = this.props.account;
    const crypto = account == null ? null : account.getLocalCrypto();
    if (crypto == null) {
      return;
    }
    crypto.deleteLastSecret().then(() => {
      console.log("Secret deleted");
      this.forceUpdate();
    });
  };

  getAdjustedHeight = (el, minHeight) => {
    var outerHeight = parseInt(window.getComputedStyle(el).height, 10);
    var diff = outerHeight - el.clientHeight;
    return Math.max(minHeight, el.scrollHeight + diff);
  };

  render() {
    let card = null;
    const account = this.props.account;
    const crypto = account == null ? null : account.getLocalCrypto();
    if (crypto != null && crypto.getLastSecretId() != null) {
      card = (
        <Card>
          <Card.Header>
            <Row>
              <Col>
                <code className={styles.encr_id}>
                  {crypto.getLastSecretId()}
                </code>
              </Col>
              <Col>
                <img src={KeyImg} className={styles.key_item_img} alt={"key"} />
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={this.handleDeleteSecret}
                >
                  Delete
                </Button>
              </Col>
            </Row>
          </Card.Header>
          <Card.Body>
            <ButtonGroup>
              <Button variant="outline-secondary" size="sm">
                Copy
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={this.handleToggleReveal}
              >
                Reveal
              </Button>
            </ButtonGroup>
            <code className={styles.encr_value}>
              {this.state.reveal
                ? crypto.getLastSecretPhrase()
                : "****************"}
            </code>
          </Card.Body>
        </Card>
      );
    } else {
      card = (
        <Card>
          <Card.Header>
            <Emoji symbol="❌" label="No" />
            There is no local secret on this device
          </Card.Header>
          <Card.Body>
            <InputGroup>
              <Form.Control
                as="textarea"
                aria-label="With textarea"
                className={joinClasses(styles.secret_input)}
                value={this.state.input}
                onChange={this.handleChange}
                style={{
                  height: this.state.height + "px",
                  resize: null,
                }}
                spellCheck="false"
                ref={this.textAreaRef}
              />
            </InputGroup>
            <Button variant="outline-success" onClick={this.handleSubmitSecret}>
              <img src={KeyImg} className={styles.key_item_img} alt={"key"} />
              Add secret
            </Button>
          </Card.Body>
        </Card>
      );
    }
    return (
      <Container className={styles.page}>
        <h2 className={styles.page_hdr}>
          <img src={KeyImg} className={styles.key_hdr_img} alt={"key"} />
          Encryption key
        </h2>
        {card}
      </Container>
    );
  }
}

export default withRouter(UserEncryption);
