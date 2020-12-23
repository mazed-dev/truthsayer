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
  // pub struct AccountInfo<'a> {
  //     pub uid: &'a str,
  //     pub name: &'a str,
  //     pub email: &'a str,
  // }
  constructor(props) {
    super(props);
    this.axiosCancelToken = axios.CancelToken.source();
    let secret = null;
    const lc = LocalCrypto.getInstance();
    if (lc !== null) {
      secret = {
        id: lc.getLastSecretId(),
        phrase: lc.getLastSecretPhrase(),
      };
    }
    this.state = {
      intput: "",
      reveal: false,
      secret: secret,
    };
  }

  componentDidMount() {
    axios
      .get("/api/auth", {
        cancelToken: this.axiosCancelToken.token,
      })
      .then((res) => {
        if (res) {
          this.setState({
            name: res.data.name,
            email: res.data.email,
          });
        }
      });
  }

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
    this.state.input;
  };

  getAdjustedHeight = (el, minHeight) => {
    var outerHeight = parseInt(window.getComputedStyle(el).height, 10);
    var diff = outerHeight - el.clientHeight;
    return Math.max(minHeight, el.scrollHeight + diff);
  };

  render() {
    // TODO: use custom user uploaded picture for userpic here
    let card = null;
    if (this.state.secret === null) {
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
                spellcheck="false"
                ref={this.textAreaRef}
              />
            </InputGroup>
            <Button variant="outline-success">
              <img src={KeyImg} className={styles.key_item_img} alt={"key"} />
              Add secret
            </Button>
          </Card.Body>
        </Card>
      );
    } else {
      const kv = this.state.secret;
      card = (
        <Card>
          <Card.Header>
            <Row>
              <Col>
                <code className={styles.encr_id}>{kv.id}</code>
              </Col>
              <Col>
                <img src={KeyImg} className={styles.key_item_img} alt={"key"} />
                <Button variant="outline-secondary" size="sm">
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
              {this.state.reveal ? kv.phrase : "****************"}
            </code>
          </Card.Body>
        </Card>
      );
    }
    // <Button variant="outline-secondary" as={Link} to="/" className="m-2">
    //   Go back
    // </Button>
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
