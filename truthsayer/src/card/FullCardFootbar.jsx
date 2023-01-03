/** @jsxImportSource @emotion/react */

import React, { useContext } from 'react'
import { css } from '@emotion/react'

import { withRouter } from 'react-router-dom'
import { ButtonToolbar } from 'react-bootstrap'

import PropTypes from 'prop-types'

import { smuggler, NodeUtil } from 'smuggler-api'
import { jcss, TDoc } from 'elementary'

import styles from './FullCardFootbar.module.css'

import DownloadImg from './../img/download.png'
import CopyImg from './../img/copy.png'
import ArchiveImg from './../img/archive.png'
import DeleteImg from './../img/delete.png'

import { ShareModal } from './ShareModal'

import { MzdGlobalContext } from '../lib/global'
import { NotificationToast } from '../lib/Toaster'
import { slateToMarkdown } from 'librarius'
import { goto } from '../lib/route'
import { downloadAsFile } from '../util/download_as_file'

import {
  FootbarDropdown,
  FootbarDropdownDivider,
  FootbarDropdownItem,
  FootbarDropdownMenu,
  FootbarDropdownToggleMeatballs,
} from './Footbar'

function nodeToMarkdown(node, storage) {
  let md = ''
  if (NodeUtil.isImage(node)) {
    const source = storage.blob.sourceUrl(node.nid)
    md = md.concat(`![](${source})`)
  }
  const text = node.text
  if (text) {
    const doc = TDoc.fromNodeTextData(text)
    md = md.concat(slateToMarkdown(doc.slate))
  }
  return md
}

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
          toaster.push(
            <NotificationToast
              title={'Copied'}
              message={'Note copied to clipboard as markdown'}
              key={this.props.nid}
            />
          )
        },
        () => {
          /* clipboard write failed */
          toaster.push(
            <NotificationToast
              title={'Error'}
              message={'Write to system clipboard failed'}
              key={this.props.nid}
            />
          )
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
    toaster.push(
      <NotificationToast
        title={'Not yet implemented'}
        message={'Archive feature is not yet implemented'}
        key={this.props.nid}
      />
    )
  }

  handleDeleteNote = () => {
    const toaster = this.props.context.toaster
    this.props.context.storage.node
      .delete({
        nid: this.props.nid,
        signal: this.deleteAbortController.signal,
      })
      .then(() => {
        toaster.push(
          <NotificationToast
            title={'Moved to bin'}
            message={
              'Notes that have been in the bin for more than 28 days will be deleted automatically'
            }
            key={this.props.nid}
          />
        )
        goto.default({ history: this.props.history })
      })
  }

  render() {
    return (
      <>
        <div
          css={css`
            width: 100%;
            display: flex;
            justify-content: space-between;
          `}
        >
          <FootbarDropdown className={jcss(styles.toolbar_layout_item)}>
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
        </div>
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

export function FullCardFootbar({ /* children,  */ node, ...rest }) {
  const ctx = useContext(MzdGlobalContext)
  const { account } = ctx
  if (node && node.meta) {
    const { nid, meta } = node
    if (NodeUtil.isOwnedBy(node, account)) {
      const getMarkdown = async () => {
        return nodeToMarkdown(node, ctx.storage)
      }
      return (
        <PrivateFullCardFootbar
          nid={nid}
          meta={meta}
          getMarkdown={getMarkdown}
          context={ctx}
          {...rest}
        />
      )
    } else {
      return <PublicFullCardFootbar nid={nid} context={ctx} {...rest} />
    }
  }
  // TODO(akindyakov): empty footbard to allocate space?
  return null
}
