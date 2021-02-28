import React from "react";

import { Modal, Button, ButtonToolbar, Form, ListGroup } from "react-bootstrap";

import axios from "axios";
import keycode from "keycode";

import { Loader } from "./../lib/loader";
import { ImgButton } from "./../lib/ImgButton";
import { smugler } from "./../smugler/api";
import { joinClasses } from "../util/elClass.js";
import { HoverTooltip } from "../lib/tooltip";

import styles from "./ShareModal.module.css";

import EncryptedImg from "./../img/encrypted.png";
import DecryptedImg from "./../img/decrypted.png";
import PrivateImg from "./../img/private.png";
import PublicImg from "./../img/public.png";

class ShareModalWindow extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // input: "",
      q: "",
      startSmartSearchTimeout: 0,
      cursor: 0,
      meta: null,
    };
    // this.inputRef = React.createRef();
    this.fetchCardShareCancelToken = axios.CancelToken.source();
  }

  componentDidMount() {
    // this.inputRef.current.focus();
    this.fetchMeta();
  }

  componentWillUnmount() {
    this.fetchCardShareCancelToken.cancel();
  }

  fetchMeta = () => {
    console.log("Fetch meta for ", this.props.nid);
    smugler.meta
      .get({
        nid: this.props.nid,
        cancelToken: this.fetchCardShareCancelToken.token,
      })
      .then((meta) => {
        console.log("Got fetch meta ", meta);
        this.setState({
          meta: meta,
        });
      });
  };

  updateMeta = (by_link) => {
    console.log("Update meta for ", this.props.nid);
    this.setState({ meta: null });
    let meta = {
      share: {
        by_link: by_link,
      },
    };
    smugler.meta
      .update({
        nid: this.props.nid,
        meta: meta,
        cancelToken: this.fetchCardShareCancelToken.token,
      })
      .then(() => {
        this.setState({ meta: meta });
      });
  };

  handlePublishNode = () => {
    this.updateMeta(true);
  };

  handleHideNode = () => {
    this.updateMeta(false);
  };

  handleChange = (event) => {
    const input = event.target.value;
    if (this.state.startSmartSearchTimeout) {
      clearTimeout(this.state.startSmartSearchTimeout);
    }
    this.setState({
      input: input,
      // Hack to avoid fetching on every character. If the time interval between
      // 2 consecutive keystokes is too short, don't fetch results.
      startSmartSearchTimeout: setTimeout(() => {
        this.startSmartSearch(input);
      }, 450),
    });
  };

  startSmartSearch = (input) => {
    //*dbg*/ console.log("startSmartSearch", input);
    // Search usernames for autocompletion
  };

  handleSumbit = (event) => {};

  render() {
    let stateImg = null;
    let stateTxt = null;
    let shareOptions = null;
    let meta = this.state.meta;
    if (meta == null) {
      stateImg = <Loader size="small" />;
    } else {
      let img_ = null;
      let share = meta.share;
      console.log("Is shared", share);
      if (share && share.by_link) {
        console.log("Is shared by link");
        img_ = PublicImg;
        stateTxt = "Publicly availiable";
        // Hide
        shareOptions = (
          <>
            <ListGroup.Item>
              <ImgButton
                variant="light"
                className={joinClasses(styles.tool_button)}
                onClick={this.handleHideNode}
              >
                <img
                  src={PrivateImg}
                  className={styles.status_img}
                  alt="Publish"
                />
                Revoke public access by link
              </ImgButton>
            </ListGroup.Item>
          </>
        );
      } else if (this.state.meta.local_secret_id != null) {
        console.log("Is shared with certain uids");
        img_ = EncryptedImg;
        stateTxt = "Private and encrypted";
        // Decrypt
        shareOptions = (
          <>
            <ListGroup.Item>
              <ImgButton
                variant="light"
                className={joinClasses(styles.tool_button)}
                onClick={this.handleHideNode}
              >
                <img
                  src={DecryptedImg}
                  className={styles.status_img}
                  alt="Decrypt"
                />
                Decrypt note
              </ImgButton>
            </ListGroup.Item>
          </>
        );
      } else {
        console.log("Is not shared");
        img_ = PrivateImg;
        stateTxt = "Private, not encrypted";
        // Encrypt
        // Publish
        // <ListGroup.Item>
        //   <ImgButton
        //     variant="light"
        //     className={joinClasses(styles.tool_button)}
        //     onClick={null}
        //   >
        //     <img
        //       src={EncryptedImg}
        //       className={styles.status_img}
        //       alt="Encrypt"
        //     />
        //     Encrypt note with local secret
        //   </ImgButton>
        // </ListGroup.Item>
        shareOptions = (
          <>
            <ListGroup.Item>
              <ImgButton
                variant="light"
                className={joinClasses(styles.tool_button)}
                onClick={this.handlePublishNode}
              >
                <img
                  src={PublicImg}
                  className={styles.status_img}
                  alt="Publish"
                />
                Make it availiable for anyone with a link
              </ImgButton>
            </ListGroup.Item>
          </>
        );
      }
      stateImg = (
        <img src={img_} className={styles.status_img} alt={stateTxt} />
      );
    }
    // <Modal.Body>
    //   <Form.Control
    //     aria-label="Search-to-link"
    //     aria-describedby="basic-addon1"
    //     onChange={this.handleChange}
    //     onSubmit={this.handleSumbit}
    //     value={this.state.input}
    //     placeholder="Type something"
    //     ref={this.inputRef}
    //   />
    // </Modal.Body>
    return (
      <>
        <Modal.Header closeButton>
          <Modal.Title>
            {stateImg} {stateTxt}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ListGroup>{shareOptions}</ListGroup>
        </Modal.Body>
      </>
    );
  }
}

export class ShareModal extends React.Component {
  render() {
    return (
      <Modal
        show={this.props.show}
        onHide={this.props.onHide}
        backdrop={"static"}
        size="xl"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        keyboard={true}
        restoreFocus={false}
        animation={false}
        dialogClassName={""}
        scrollable={true}
        enforceFocus={true}
      >
        <ShareModalWindow nid={this.props.nid} account={this.props.account} />
      </Modal>
    );
  }
}

ShareModal.defaultProps = {};
