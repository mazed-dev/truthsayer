/** @jsxImportSource @emotion/react */

import React, { PropsWithChildren, useContext } from 'react'
import { css } from '@emotion/react'

import { useNavigate, NavigateFunction } from 'react-router-dom'
import { ButtonToolbar } from 'react-bootstrap'

import { NodeMeta, NodeUtil, StorageApi, TNode } from 'smuggler-api'
import { jcss, TDoc } from 'elementary'

import styles from './FullCardFootbar.module.css'

import DownloadImg from './../img/download.png'
import CopyImg from './../img/copy.png'
import ArchiveImg from './../img/archive.png'
import DeleteImg from './../img/delete.png'

import { MzdGlobalContext, MzdGlobalContextProps } from '../lib/global'
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
import { log, Optional } from 'armoury'

function nodeToMarkdown(node: TNode, storage: StorageApi) {
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

type PrivateFullCardFootbarProps = PropsWithChildren<{
  nid: string
  meta: NodeMeta
  getMarkdown: () => Promise<string>
  context: MzdGlobalContextProps
}>

class PrivateFullCardFootbarImpl extends React.Component<
  PrivateFullCardFootbarProps & { navigate: NavigateFunction }
> {
  deleteAbortController: AbortController

  constructor(
    props: PrivateFullCardFootbarProps & { navigate: NavigateFunction }
  ) {
    super(props)
    this.state = {}
    this.deleteAbortController = new AbortController()
  }

  handleCopyMarkdown = () => {
    const toaster = this.props.context.toaster
    this.props.getMarkdown().then(
      (md) => {
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
      },
      (reason) => log.error(`Failed to get markdown: ${reason}`)
    )
  }

  handleDownloadMarkdown = () => {
    this.props.getMarkdown().then(
      (md) => {
        downloadAsFile(`${this.props.nid}.txt`, md).catch((reason) =>
          log.error(`Failed to download markdown as file: ${reason}`)
        )
      },
      (reason) => log.error(`Failed to get markdown: ${reason}`)
    )
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
      .delete(
        {
          nid: this.props.nid,
        },
        this.deleteAbortController.signal
      )
      .then(
        () => {
          toaster.push(
            <NotificationToast
              title={'Moved to bin'}
              message={
                'Notes that have been in the bin for more than 28 days will be deleted automatically'
              }
              key={this.props.nid}
            />
          )
          goto.default({ navigate: this.props.navigate })
        },
        (reason) => log.error(`Failed to delete node: ${reason}`)
      )
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
      </>
    )
  }
}

function PrivateFullCardFootbar(props: PrivateFullCardFootbarProps) {
  const navigate = useNavigate()
  return <PrivateFullCardFootbarImpl navigate={navigate} {...props} />
}

type PublicFullCardFootbarProps = PropsWithChildren<{
  nid: string
  context: MzdGlobalContextProps
}>

function PublicFullCardFootbar(_props: PublicFullCardFootbarProps) {
  return <ButtonToolbar className={jcss(styles.toolbar)} />
}

export function FullCardFootbar({
  /* children,  */ node,
}: {
  node: Optional<TNode>
}) {
  const ctx = useContext(MzdGlobalContext)
  const { account } = ctx
  if (node && node.meta) {
    const { nid, meta } = node
    if (NodeUtil.isOwnedBy(node, account ?? undefined)) {
      const getMarkdown = async () => {
        return nodeToMarkdown(node, ctx.storage)
      }
      return (
        <PrivateFullCardFootbar
          nid={nid}
          meta={meta}
          getMarkdown={getMarkdown}
          context={ctx}
        />
      )
    } else {
      return <PublicFullCardFootbar nid={nid} context={ctx} />
    }
  }
  // TODO(akindyakov): empty footbard to allocate space?
  return null
}
