import React, { useContext } from 'react'

import { withRouter } from 'react-router-dom'
import { ButtonToolbar } from 'react-bootstrap'

import PropTypes from 'prop-types'

import { smuggler } from 'smuggler-api'

import styles from './FullCardFootbar.module.css'

import DownloadImg from './../img/download.png'
import CopyImg from './../img/copy.png'
import ArchiveImg from './../img/archive.png'
import DeleteImg from './../img/delete.png'

import EncryptedImg from './../img/encrypted.png'
import PrivateImg from './../img/private.png'
import PublicImg from './../img/public.png'

import { ShareModal } from './ShareModal'

import { MzdGlobalContext } from '../lib/global'
import { HoverTooltip } from '../lib/tooltip'
import { ImgButton } from '../lib/ImgButton'
import { goto } from '../lib/route'
import { jcss } from '../util/jcss'
import { docAsMarkdown } from '../doc/doc_util'
import { downloadAsFile } from '../util/download_as_file.jsx'

import {
  FootbarDropdown,
  FootbarDropdownDivider,
  FootbarDropdownItem,
  FootbarDropdownMenu,
  FootbarDropdownToggleMeatballs,
} from './Footbar'

class PrivateFullCardFootbarImpl extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      modalShareShow: false,
    }
    this.deleteAbortController = new AbortController()
  }

  static propTypes = {
    history: PropTypes.object.isRequired,
  }

  hideShareDialog = (event) => {
    this.setState({ modalShareShow: false })
  }

  showShareDialog = (event) => {
    this.setState({ modalShareShow: true })
  }

  handleCopyMarkdown = () => {
    const toaster = this.props.context.toaster
    this.props.getMarkdown().then((md) => {
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
    })
  }

  handleDownloadMarkdown = () => {
    this.props.getMarkdown().then((md) => {
      downloadAsFile(`${this.props.nid}.txt`, md)
    })
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
    smuggler.node
      .delete({
        nid: this.props.nid,
        signal: this.deleteAbortController.signal,
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
        </ButtonToolbar>
        <ShareModal
          show={this.state.modalShareShow}
          nid={this.props.nid}
          onHide={this.hideShareDialog}
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
  }

  static propTypes = {
    history: PropTypes.object.isRequired,
  }

  render() {
    return (
      <>
        <ButtonToolbar className={jcss(styles.toolbar)} />
      </>
    )
  }
}

const PublicFullCardFootbar = withRouter(PublicFullCardFootbarImpl)

export function FullCardFootbar({ children, node, ...rest }) {
  const ctx = useContext(MzdGlobalContext)
  const { account } = ctx
  if (node && node.meta) {
    const { nid, meta } = node
    if (node.isOwnedBy(account)) {
      const getMarkdown = async () => {
        return await docAsMarkdown(node)
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
