import React, { useContext } from 'react'

import { withRouter } from 'react-router-dom'
import { Button, ButtonToolbar, Modal, Form, ListGroup } from 'react-bootstrap'

import PropTypes from 'prop-types'

import { smugler } from '../smugler/api'
import { SearchGrid } from '../grid/SearchGrid'

import styles from './FullCardFootbar.module.css'

import DownloadImg from './../img/download.png'
import CopyImg from './../img/copy.png'
import SearchImg from './../img/search.png'
import ArchiveImg from './../img/archive.png'
import DeleteImg from './../img/delete.png'

import NextNewLeftImg from './../img/next-link-left-00001.png'
import NextNewRightImg from './../img/next-link-right-00001.png'

import NextCopyLeftImg from './../img/next-clone-left.png'
import NextCopyRightImg from './../img/next-clone-right.png'

import EncryptedImg from './../img/encrypted.png'
import PrivateImg from './../img/private.png'
import PublicImg from './../img/public.png'

import { ShareModal } from './ShareModal'

import { MzdGlobalContext } from '../lib/global'
import { AutocompleteWindow } from '../smartpoint/AutocompleteWindow'
import { HoverTooltip } from '../lib/tooltip'
import { ImgButton } from '../lib/ImgButton'
import { goto } from '../lib/route.jsx'
import { jcss } from '../util/jcss'
import { makeACopy, docAsMarkdown } from '../doc/doc_util.jsx'
import { downloadAsFile } from '../util/download_as_file.jsx'

import {
  FootbarDropdown,
  FootbarDropdownDivider,
  FootbarDropdownItem,
  FootbarDropdownMenu,
  FootbarDropdownToggle,
  FootbarDropdownToggleMeatballs,
} from './Footbar'

const lodash = require('lodash')

class SearchAndConnectJinnModal extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      input: '',
      q: '',
      cursor: 0,
    }
    this.inputRef = React.createRef()
  }

  componentDidMount() {
    this.inputRef.current.focus()
  }

  handleChange = (event) => {
    const { value } = event.target
    this.startSmartSearch.cancel() // Do we need it?
    this.setState(
      {
        input: value,
      },
      () => {
        this.startSmartSearch(value)
      }
    )
  }

  handleSumbit = (event) => {}

  startSmartSearch = lodash.debounce((value) => {
    this.setState({ cards: [], q: value })
  }, 800)

  addCards = (cards) => {
    this.setState((state) => {
      return {
        cards: lodash.concat(state.cards, cards),
      }
    })
  }

  onNodeCardClick = (node) => {
    const { nid, left, addRef, setShow } = this.props
    const other_nid = node.nid
    if (left) {
      addRef({ from: other_nid, to: nid })
    } else {
      addRef({ from: nid, to: other_nid })
    }
    setShow(false)
  }

  render() {
    const { q, input, cards } = this.state
    return (
      <div className={styles.autocomplete_modal}>
        <Form.Control
          aria-label="Search-to-link"
          aria-describedby="basic-addon1"
          onChange={this.handleChange}
          onSubmit={this.handleSumbit}
          value={input}
          placeholder="Type something"
          ref={this.inputRef}
        />
        <SearchGrid
          q={q}
          defaultSearch={false}
          onCardClick={this.onNodeCardClick}
          portable
        >
          {cards}
        </SearchGrid>
      </div>
    )
  }
}

export const SearchAndConnectJinn = ({ show, setShow, nid, addRef, left }) => {
  return (
    <Modal
      show={show}
      onHide={() => setShow(false)}
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
      <SearchAndConnectJinnModal
        nid={nid}
        setShow={setShow}
        addRef={addRef}
        left={left}
      />
    </Modal>
  )
}

async function cloneNode({ from, to, crypto, cancelToken, isBlank }) {
  const nid = from ? from : to
  const node = await smugler.node.get({
    nid,
    crypto,
    cancelToken,
  })
  const doc = await makeACopy(node.doc, nid, isBlank || false)
  return await smugler.node.create({
    doc,
    cancelToken,
    from_nid: from,
    to_nid: to,
  })
}

class PrivateFullCardFootbarImpl extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      modalLeftShow: false,
      modalRightShow: false,
      modalShareShow: false,
    }
    this.createCancelToken = smugler.makeCancelToken()
    this.deleteCancelToken = smugler.makeCancelToken()
  }

  static propTypes = {
    history: PropTypes.object.isRequired,
  }

  handleNextRight = (event) => {
    smugler.node
      .create({
        cancelToken: this.createCancelToken.token,
        from_nid: this.props.nid,
      })
      .then((node) => {
        if (node) {
          const { nid } = node
          goto.node({ history: this.props.history, nid })
        }
      })
  }

  handleNextRightClone = (event) => {
    const account = this.props.context.account
    cloneNode({
      from: this.props.nid,
      to: null,
      crypto: account.getLocalCrypto(),
      cancelToken: this.createCancelToken.token,
    }).then((node) => {
      if (node) {
        const { nid } = node
        goto.node({ history: this.props.history, nid })
      }
    })
  }

  handleNextLeftBlankCopy = () => {
    const account = this.props.context.account
    cloneNode({
      from: null,
      to: this.props.nid,
      crypto: account.getLocalCrypto(),
      cancelToken: this.createCancelToken.token,
      isBlank: true,
    }).then((node) => {
      if (node) {
        const { nid } = node
        goto.node({ history: this.props.history, nid })
      }
    })
  }

  handleNextRightBlankCopy = () => {
    const account = this.props.context.account
    cloneNode({
      from: this.props.nid,
      to: null,
      crypto: account.getLocalCrypto(),
      cancelToken: this.createCancelToken.token,
      isBlank: true,
    }).then((node) => {
      if (node) {
        const { nid } = node
        goto.node({ history: this.props.history, nid })
      }
    })
  }

  handleNextLeft = (event) => {
    smugler.node
      .create({
        cancelToken: this.createCancelToken.token,
        to_nid: this.props.nid,
      })
      .then((node) => {
        if (node) {
          const { nid } = node
          goto.node({ history: this.props.history, nid })
        }
      })
  }

  handleNextLeftClone = () => {
    const account = this.props.context.account
    cloneNode({
      from: null,
      to: this.props.nid,
      crypto: account.getLocalCrypto(),
      cancelToken: this.createCancelToken.token,
    }).then((node) => {
      if (node) {
        const { nid } = node
        goto.node({ history: this.props.history, nid })
      }
    })
  }

  handleNextLeftSearch = (event) => {
    this.setSearchShow(true, true)
  }

  handleNextRightSearch = (event) => {
    this.setSearchShow(true, false)
  }

  setSearchShow = (show, left) => {
    if (show) {
      if (left) {
        this.setState({
          modalLeftShow: true,
          modalRightShow: false,
        })
      } else {
        this.setState({
          modalLeftShow: false,
          modalRightShow: true,
        })
      }
    } else {
      this.setState({
        modalRightShow: false,
        modalLeftShow: false,
      })
    }
  }

  hideShareDialog = (event) => {
    this.setState({ modalShareShow: false })
  }

  showShareDialog = (event) => {
    this.setState({ modalShareShow: true })
  }

  handleCopyMarkdown = () => {
    const toaster = this.props.context.toaster
    const md = this.props.getMarkdown()
    navigator.clipboard.writeText(md).then(
      () => {
        /* clipboard successfully set */
        toaster.push({
          title: 'Copied',
          message: 'Note copied to clipboard as markdown',
        })
      },
      () => {
        /* clipboard write failed */
        toaster.push({
          title: 'Error',
          message: 'Write to system clipboard failed',
        })
      }
    )
  }

  handleDownloadMarkdown = () => {
    const md = this.props.getMarkdown()
    downloadAsFile(`${this.props.nid}.txt`, md)
  }

  handleArchiveDoc = () => {
    const toaster = this.props.context.toaster
    toaster.push({
      title: 'Not yet implemented',
      message: 'Archive feature is not yet implemented',
    })
  }

  handleDeleteNote = () => {
    const toaster = this.props.context.toaster
    smugler.node
      .delete({
        nid: this.props.nid,
        cancelToken: this.deleteCancelToken.token,
      })
      .then(() => {
        toaster.push({
          title: 'Moved to bin',
          message:
            'Notes that have been in the bin for more than 28 days will be deleted automatically',
        })
        goto.default({ history: this.props.history })
      })
  }

  getShareBtn = () => {
    let img_ = PrivateImg
    const txt_ = 'Share'
    if (this.props.meta && this.props.meta) {
      const share = this.props.meta.share
      if (share && share.by_link) {
        img_ = PublicImg
      }
      const local_secret_id = this.props.meta.local_secret_id
      if (local_secret_id) {
        img_ = EncryptedImg
      }
    }
    return (
      <HoverTooltip tooltip={txt_}>
        <img
          src={img_}
          className={styles.tool_button_img}
          alt={'Publicity and encryption'}
        />
      </HoverTooltip>
    )
  }

  render() {
    return (
      <>
        <ButtonToolbar className={jcss(styles.toolbar)}>
          <FootbarDropdown>
            <FootbarDropdownToggle>
              <HoverTooltip tooltip={'Link to the left'}>
                <img
                  src={NextNewLeftImg}
                  className={styles.tool_button_img}
                  alt="Add left link"
                />
              </HoverTooltip>
            </FootbarDropdownToggle>

            <FootbarDropdownMenu>
              <FootbarDropdownItem
                className={styles.dropdown_menu_item}
                onClick={this.handleNextLeft}
              >
                <img
                  src={NextNewLeftImg}
                  className={styles.dropdown_menu_inline_img}
                  alt="Create new to the left"
                />
                Create new
              </FootbarDropdownItem>
              <FootbarDropdownItem
                className={styles.dropdown_menu_item}
                onClick={this.handleNextLeftClone}
              >
                <img
                  src={NextCopyLeftImg}
                  className={styles.dropdown_menu_inline_img}
                  alt="Copy and link"
                />
                Copy
              </FootbarDropdownItem>
              <FootbarDropdownItem
                className={styles.dropdown_menu_item}
                onClick={this.handleNextLeftBlankCopy}
              >
                <img
                  src={NextCopyLeftImg}
                  className={styles.dropdown_menu_inline_img}
                  alt="Blank copy and link"
                />
                Blank copy
              </FootbarDropdownItem>
              <FootbarDropdownItem
                className={styles.dropdown_menu_item}
                onClick={this.handleNextLeftSearch}
              >
                <img
                  src={SearchImg}
                  className={styles.dropdown_menu_inline_img}
                  alt="Search and link"
                />
                Search to bind
              </FootbarDropdownItem>
            </FootbarDropdownMenu>
          </FootbarDropdown>

          <ImgButton
            onClick={this.showShareDialog}
            className={jcss(styles.tool_button, styles.toolbar_layout_item)}
          >
            {this.getShareBtn()}
          </ImgButton>

          <FootbarDropdown>
            <FootbarDropdownToggleMeatballs
              id={'more-options-for-fullsize-card'}
            />

            <FootbarDropdownMenu>
              <FootbarDropdownItem
                className={styles.dropdown_menu_item}
                onClick={this.handleCopyMarkdown}
              >
                <img
                  src={CopyImg}
                  className={styles.dropdown_menu_inline_img}
                  alt="Copy as markdown"
                />
                Copy as markdown
              </FootbarDropdownItem>
              <FootbarDropdownItem
                className={styles.dropdown_menu_item}
                onClick={this.handleDownloadMarkdown}
              >
                <img
                  src={DownloadImg}
                  className={styles.dropdown_menu_inline_img}
                  alt="Download as text"
                />
                Download as text
              </FootbarDropdownItem>

              <FootbarDropdownDivider />
              <FootbarDropdownItem
                className={styles.dropdown_menu_item}
                onClick={this.handleDeleteNote}
              >
                <img
                  src={DeleteImg}
                  className={styles.dropdown_menu_inline_img}
                  alt={'Delete'}
                />
                Delete
              </FootbarDropdownItem>
              <FootbarDropdownDivider />
              <FootbarDropdownItem
                className={styles.dropdown_menu_item}
                onClick={this.handleArchiveDoc}
              >
                <img
                  src={ArchiveImg}
                  className={styles.dropdown_menu_inline_img}
                  alt={'Archive'}
                />
                Archive
              </FootbarDropdownItem>
            </FootbarDropdownMenu>
          </FootbarDropdown>

          <FootbarDropdown>
            <FootbarDropdownToggle>
              <HoverTooltip tooltip={'Link to the right'}>
                <img
                  src={NextNewRightImg}
                  className={styles.tool_button_img}
                  alt="Add left link"
                />
              </HoverTooltip>
            </FootbarDropdownToggle>

            <FootbarDropdownMenu>
              <FootbarDropdownItem
                className={styles.dropdown_menu_item}
                onClick={this.handleNextRight}
              >
                <img
                  src={NextNewRightImg}
                  className={styles.dropdown_menu_inline_img}
                  alt="Create new to the right"
                />
                Create new
              </FootbarDropdownItem>
              <FootbarDropdownItem
                className={styles.dropdown_menu_item}
                onClick={this.handleNextRightClone}
              >
                <img
                  src={NextCopyRightImg}
                  className={styles.dropdown_menu_inline_img}
                  alt="Copy and link"
                />
                Copy
              </FootbarDropdownItem>
              <FootbarDropdownItem
                className={styles.dropdown_menu_item}
                onClick={this.handleNextRightBlankCopy}
              >
                <img
                  src={NextCopyRightImg}
                  className={styles.dropdown_menu_inline_img}
                  alt="Blank copy and link"
                />
                Blank copy
              </FootbarDropdownItem>
              <FootbarDropdownItem
                className={styles.dropdown_menu_item}
                onClick={this.handleNextRightSearch}
              >
                <img
                  src={SearchImg}
                  className={styles.dropdown_menu_inline_img}
                  alt="Search and link"
                />
                Search
              </FootbarDropdownItem>
            </FootbarDropdownMenu>
          </FootbarDropdown>
        </ButtonToolbar>
        <ShareModal
          show={this.state.modalShareShow}
          nid={this.props.nid}
          onHide={this.hideShareDialog}
        />
        <SearchAndConnectJinn
          nid={this.props.nid}
          addRef={this.props.addRef}
          show={this.state.modalLeftShow || this.state.modalRightShow}
          left={this.state.modalLeftShow}
          setShow={this.setSearchShow}
        />
      </>
    )
  }
}

const PrivateFullCardFootbar = withRouter(PrivateFullCardFootbarImpl)

class PublicFullCardFootbarImpl extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
    this.createCancelToken = smugler.makeCancelToken()
  }

  static propTypes = {
    history: PropTypes.object.isRequired,
  }

  getAccountOrLogin = () => {
    const context = this.props.context
    if (context && context.account) {
      return context.account
    }
    goto.notice.logInToContinue({ history: this.props.history })
    return null
  }

  handleNextRight = (event) => {
    const account = this.getAccountOrLogin()
    if (!account) {
      return
    }
    smugler.node
      .create({
        cancelToken: this.createCancelToken.token,
        from_nid: this.props.nid,
      })
      .then((node) => {
        if (node) {
          const { nid } = node
          goto.node({ history: this.props.history, nid })
        }
      })
  }

  handleNextRightClone = (event) => {
    const account = this.getAccountOrLogin()
    if (!account) {
      return
    }
    cloneNode({
      from: this.props.nid,
      to: null,
      crypto: account.getLocalCrypto(),
      cancelToken: this.createCancelToken.token,
    }).then((node) => {
      if (node) {
        const { nid } = node
        goto.node({ history: this.props.history, nid })
      }
    })
  }

  handleNextLeft = (event) => {
    const account = this.getAccountOrLogin()
    if (!account) {
      return
    }
    smugler.node
      .create({
        cancelToken: this.createCancelToken.token,
        to_nid: this.props.nid,
      })
      .then((node) => {
        if (node) {
          const { nid } = node
          goto.node({ history: this.props.history, nid })
        }
      })
  }

  handleNextLeftClone = () => {
    const account = this.getAccountOrLogin()
    if (!account) {
      return
    }
    cloneNode({
      from: null,
      to: this.props.nid,
      crypto: account.getLocalCrypto(),
      cancelToken: this.createCancelToken.token,
    }).then((node) => {
      if (node) {
        const { nid } = node
        goto.node({ history: this.props.history, nid })
      }
    })
  }

  render() {
    return (
      <>
        <ButtonToolbar className={jcss(styles.toolbar)}>
          <ImgButton
            onClick={this.handleNextLeft}
            className={jcss(styles.tool_button, styles.toolbar_layout_item)}
          >
            <HoverTooltip tooltip={'Link to the left'}>
              <img
                src={NextNewLeftImg}
                className={styles.tool_button_img}
                alt="Add left link"
              />
            </HoverTooltip>
          </ImgButton>

          <ImgButton
            onClick={this.handleNextLeftClone}
            className={jcss(styles.tool_button, styles.toolbar_layout_item)}
          >
            <HoverTooltip tooltip={'Copy and link'}>
              <img
                src={NextCopyLeftImg}
                className={styles.tool_button_img}
                alt="Copy and link"
              />
            </HoverTooltip>
          </ImgButton>

          <ImgButton
            onClick={this.handleNextRightClone}
            className={jcss(styles.tool_button, styles.toolbar_layout_item)}
          >
            <HoverTooltip tooltip={'Copy and link'}>
              <img
                src={NextCopyRightImg}
                className={styles.tool_button_img}
                alt="Copy and link"
              />
            </HoverTooltip>
          </ImgButton>

          <ImgButton
            onClick={this.handleNextRight}
            className={jcss(styles.tool_button, styles.toolbar_layout_item)}
          >
            <HoverTooltip tooltip={'Link to the right'}>
              <img
                src={NextNewRightImg}
                className={styles.tool_button_img}
                alt="Add right link"
              />
            </HoverTooltip>
          </ImgButton>
        </ButtonToolbar>
      </>
    )
  }
}

const PublicFullCardFootbar = withRouter(PublicFullCardFootbarImpl)

export function FullCardFootbar({ children, node, ...rest }) {
  const ctx = useContext(MzdGlobalContext)
  const { account } = ctx
  if (node && node.meta) {
    const { nid, meta, doc } = node
    if (node.isOwnedBy(account)) {
      const getMarkdown = () => {
        return docAsMarkdown(doc)
      }
      return (
        <PrivateFullCardFootbar
          nid={nid}
          meta={meta}
          getMarkdown={getMarkdown}
          context={ctx}
          {...rest}
        >
          {children}
        </PrivateFullCardFootbar>
      )
    } else {
      return (
        <PublicFullCardFootbar nid={nid} context={ctx} {...rest}>
          {children}
        </PublicFullCardFootbar>
      )
    }
  }
  // TODO(akindyakov): empty footbard to allocate space?
  return null
}
