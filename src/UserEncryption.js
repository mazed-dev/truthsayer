import React from 'react'

// React router
import {
  InputGroup,
  Form,
  Button,
  ButtonGroup,
  Container,
  Card,
  Row,
  Col,
} from 'react-bootstrap'

import axios from 'axios'
import { withRouter } from 'react-router-dom'

import { jcss } from './util/jcss'
import { isAscii } from './util/ascii.jsx'
import { Loader } from './lib/loader'

import { Emoji } from './Emoji.js'

import styles from './UserEncryption.module.css'

import KeyImg from './crypto/img/yellow_key.png'

class UserEncryption extends React.Component {
  constructor(props) {
    super(props)
    this.axiosCancelToken = axios.CancelToken.source()
    this.state = {
      intput: '',
      is_good_enough: false,
      strength_str: '',
      reveal: false,
      message: null,
    }
  }

  componentDidMount() {}

  componentWillUnmount() {
    this.axiosCancelToken.cancel()
  }

  handleToggleReveal = () => {
    this.setState((state) => {
      return { reveal: !state.reveal }
    })
  }

  handleChange = (event) => {
    const input = event.target.value
    const ref = event.target
    this.setState({
      input,
      height: this.getAdjustedHeight(ref, 42),
    })
    this.evaluateSecretStrength(input)
  }

  handleSubmitSecret = () => {
    const account = this.props.account
    const crypto = account == null ? null : account.getLocalCrypto()
    // *dbg*/ console.log('Submit...', crypto)
    if (crypto != null) {
      // *dbg*/ console.log('Crypto is initialised')
      const secretPhrase = this.state.input
      crypto.appendSecret(secretPhrase).then((id) => {
        // *dbg*/ console.log('Secret added', id)
        this.forceUpdate()
      })
    }
  }

  handleCopySecretToClipboard = () => {
    const account = this.props.account
    const crypto = account == null ? null : account.getLocalCrypto()
    if (crypto == null) {
      return
    }
    navigator.clipboard.writeText(crypto.getLastSecretPhrase()).then(
      () => {
        // console.log('Async: Copying to clipboard was successful!');
        this.setState({
          message: '✅ Copied to clipboard',
        })
      },
      (err) => {
        // console.error('Async: Could not copy text: ', err);
        this.setState({
          message: `❌ Copied to clipboard, ${err}`,
        })
      }
    )
  }

  handleDeleteSecret = () => {
    // const response = window.prompt(
    //   "Are you sure you wish to delete local encryption secret?\n" +
    //     'If you are sure, type "yes" and click "OK"'
    // );
    // if (response !== "yes") {
    //   return;
    // }
    // TODO(akindyakov): make a custom modal confirmation window here
    if (
      !window.confirm(
        'Are you sure you wish to delete local encryption secret?\n\n' +
          '⚠️ Please make sure you backed it up securely, otherwise you will not ' +
          'be able to access notes encrypted by this secret.\n' +
          '💡 Use secure password managers to store secrets and passwords safely.'
      )
    ) {
      return
    }
    const account = this.props.account
    const crypto = account == null ? null : account.getLocalCrypto()
    if (crypto == null) {
      return
    }
    crypto.deleteLastSecret().then(() => {
      // *dbg*/ console.log('Secret deleted')
      this.setState(
        {
          input: '',
        },
        () => {
          this.forceUpdate()
        }
      )
    })
  }

  getAdjustedHeight = (el, minHeight) => {
    const outerHeight = parseInt(window.getComputedStyle(el).height, 10)
    const diff = outerHeight - el.clientHeight
    return Math.max(minHeight, el.scrollHeight + diff)
  }

  evaluateSecretStrength = async (input) => {
    let is_good_enough = true
    let strength_str = ''
    if (!isAscii(input)) {
      is_good_enough = false
      strength_str =
        'Invalid symbols. Secret must contain only ASCII characters'
    } else if (input.length < 24) {
      is_good_enough = false
      strength_str = 'Too short, secret must contain at least 24 symbols.'
    } else if (input.length < 32) {
      strength_str = 'Ok'
    } else if (input.length < 64) {
      strength_str = 'Good'
    } else if (input.length > 128) {
      strength_str = 'Great'
    }
    this.setState({
      is_good_enough,
      strength_str,
    })
  }

  makeSecretStrengthBadge() {
    if (!this.state.strength_str) {
      return null
    }
    if (!this.state.is_good_enough) {
      return (
        <>
          <Emoji
            symbol="❌"
            label="Incorrect"
            className={styles.strength_badge}
          />
          {this.state.strength_str}
        </>
      )
    } else {
      return (
        <>
          <Emoji symbol="✅" label="Good" className={styles.strength_badge} />
          {this.state.strength_str}
        </>
      )
    }
  }

  render() {
    let card = null
    const account = this.props.account
    const crypto = account == null ? null : account.getLocalCrypto()
    if (account == null) {
      card = <Loader />
    } else if (crypto != null && crypto.getLastSecretId() != null) {
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
                <img src={KeyImg} className={styles.key_item_img} alt={'key'} />
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
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={this.handleCopySecretToClipboard}
              >
                Copy to clipboard
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={this.handleToggleReveal}
              >
                {this.state.reveal ? 'Hide' : 'Reveal'}
              </Button>
            </ButtonGroup>
            <code className={styles.encr_value}>
              {this.state.reveal
                ? crypto.getLastSecretPhraseToRender()
                : '**************** ************************'}
            </code>
          </Card.Body>
        </Card>
      )
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
                className={jcss(styles.secret_input)}
                value={this.state.input}
                onChange={this.handleChange}
                style={{
                  height: `${this.state.height}px`,
                  resize: null,
                }}
                spellCheck="false"
                ref={this.textAreaRef}
              />
            </InputGroup>
            <Button
              variant="outline-success"
              onClick={this.handleSubmitSecret}
              disabled={!this.state.is_good_enough}
            >
              <img src={KeyImg} className={styles.key_item_img} alt={'key'} />
              Add secret
            </Button>
            {this.makeSecretStrengthBadge()}
          </Card.Body>
        </Card>
      )
    }
    return (
      <Container className={styles.page}>
        <h2 className={styles.page_hdr}>
          <img src={KeyImg} className={styles.key_hdr_img} alt={'key'} />
          Encryption key
        </h2>
        {card}
      </Container>
    )
  }
}

export default withRouter(UserEncryption)
