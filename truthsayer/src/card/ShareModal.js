import React from 'react'

import { Modal, ListGroup } from 'react-bootstrap'

import { Loader } from './../lib/loader'
import { ImgButton } from './../lib/ImgButton'
import { smuggler } from 'smuggler-api'
import { jcss } from 'elementary'

import styles from './ShareModal.module.css'

import EncryptedImg from './../img/encrypted.png'
import DecryptedImg from './../img/decrypted.png'
import PrivateImg from './../img/private.png'
import PublicImg from './../img/public.png'

class ShareModalWindow extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      // input: "",
      q: '',
      startSmartSearchTimeout: 0,
      cursor: 0,
      meta: null,
    }
    // this.inputRef = React.createRef();
    this.fetchCardShareAbortController = new AbortController()
  }

  componentDidMount() {
    // this.inputRef.current.focus();
    this.fetchMeta()
  }

  componentWillUnmount() {
    this.fetchCardShareAbortController.abort()
  }

  fetchMeta = () => {
    // *dbg*/ console.log('Fetch meta for ', this.props.nid)
    smuggler.meta
      .get({
        nid: this.props.nid,
        signal: this.fetchCardShareAbortController.signal,
      })
      .then((meta) => {
        // *dbg*/ console.log('Got fetch meta ', meta)
        this.setState({
          meta,
        })
      })
  }

  updateMeta = (by_link) => {
    // *dbg*/ console.log('Update meta for ', this.props.nid)
    this.setState({ meta: null })
    const meta = {
      share: {
        by_link,
      },
    }
    smuggler.meta
      .update({
        nid: this.props.nid,
        meta,
        signal: this.fetchCardShareAbortController.signal,
      })
      .then(() => {
        this.setState({ meta })
      })
  }

  handlePublishNode = () => {
    this.updateMeta(true)
  }

  handleHideNode = () => {
    this.updateMeta(false)
  }

  handleChange = (event) => {
    const input = event.target.value
    if (this.state.startSmartSearchTimeout) {
      clearTimeout(this.state.startSmartSearchTimeout)
    }
    this.setState({
      input,
      // Hack to avoid fetching on every character. If the time interval between
      // 2 consecutive keystokes is too short, don't fetch results.
      startSmartSearchTimeout: setTimeout(() => {
        this.startSmartSearch(input)
      }, 450),
    })
  }

  startSmartSearch = (input) => {
    //* dbg*/ console.log("startSmartSearch", input);
    // Search usernames for autocompletion
  }

  handleSumbit = (event) => {}

  render() {
    let stateImg = null
    let stateTxt = null
    let shareOptions = null
    const meta = this.state.meta
    if (meta == null) {
      stateImg = <Loader size="small" />
    } else {
      let img_ = null
      const share = meta.share
      // *dbg*/ console.log('Is shared', share)
      if (share && share.by_link) {
        // *dbg*/ console.log('Is shared by link')
        img_ = PublicImg
        stateTxt = 'Publicly availiable'
        // Hide
        shareOptions = (
          <>
            <ListGroup.Item>
              <ImgButton
                variant="light"
                className={jcss(styles.tool_button)}
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
        )
      } else if (this.state.meta.local_secret_id != null) {
        // *dbg*/ console.log('Is shared with certain uids')
        img_ = EncryptedImg
        stateTxt = 'Private and encrypted'
        // Decrypt
        shareOptions = (
          <>
            <ListGroup.Item>
              <ImgButton
                variant="light"
                className={jcss(styles.tool_button)}
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
        )
      } else {
        // *dbg*/ console.log('Is not shared')
        img_ = PrivateImg
        stateTxt = 'Private, not encrypted'
        // Encrypt
        // Publish
        // <ListGroup.Item>
        //   <ImgButton
        //     variant="light"
        //     className={jcss(styles.tool_button)}
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
                className={jcss(styles.tool_button)}
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
        )
      }
      stateImg = <img src={img_} className={styles.status_img} alt={stateTxt} />
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
    )
  }
}

export class ShareModal extends React.Component {
  render() {
    return (
      <Modal
        show={this.props.show}
        onHide={this.props.onHide}
        backdrop={'static'}
        size="xl"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        keyboard
        restoreFocus={false}
        animation={false}
        dialogClassName={''}
        scrollable
        enforceFocus
      >
        <ShareModalWindow nid={this.props.nid} account={this.props.account} />
      </Modal>
    )
  }
}

ShareModal.defaultProps = {}
