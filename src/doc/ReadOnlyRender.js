import React, { useContext } from 'react'

import styles from './ReadOnlyRender.module.css'

import { Loader } from '../lib/loader'
import LockedImg from './../img/locked.png'

import { ReadOnlyDoc } from './DocEditor.tsx'
import { ImageNode } from './image/ImageNode'

import { renderMdSmallCard } from './../markdown/MarkdownRender'

import { ChunkView } from './chunks'
import { enforceTopHeader } from './doc_util'
import { makeEmptyChunk, trimChunk } from './chunk_util'
import { smugler } from './../smugler/api'

import { MzdGlobalContext } from '../lib/global.js'
import { debug } from '../util/log'

const kMaxTrimSmallCardSize = 320
const kMaxTrimSmallCardChunksNum = 4
const kMaxTrimChunksNum = 6

export function SmallCardRender({ node }) {
  let media
  let text
  if (node == null) {
    text = <Loader />
  } else {
    const { data, nid } = node
    text = (
      <ReadOnlyDoc
        nid={nid}
        doc={data}
        className={styles.read_only_text_card}
      />
    )
    if (node.isImage()) {
      media = <ImageNode nid={nid} data={data} />
    }
  }
  return (
    <div className={styles.read_only_card}>
      {media}
      {text}
    </div>
  )
}

class ReadDocRender extends React.Component {
  render() {
    let body = null
    const node = this.props.node
    if (node == null) {
      body = (
        <div className={styles.small_card_waiter}>
          <Loader size={'small'} />
        </div>
      )
    } else {
      if (!node.crypto.success) {
        body = (
          <>
            <img src={LockedImg} className={styles.locked_img} alt={'locked'} />
            Encrypted with an unknown secret:
            <code className={styles.locked_secret_id}>
              {node.crypto.secret_id}
            </code>
          </>
        )
      } else {
        // TODO(akindyakov): trim card here if shrinked!
        body = <SmallCardRender node={node} />
      }
    }
    return <div className={styles.read_only_card}>{body}</div>
  }
}

class ReadOnlyRenderFetching extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      node: null,
    }
    this.fetchNodeCancelToken = smugler.makeCancelToken()
  }

  componentDidMount() {
    this.fetchNode()
  }

  componentWillUnmount() {
    this.fetchNodeCancelToken.cancel()
  }

  componentDidUpdate(prevProps) {
    // Don't forget to compare props!
    if (this.props.nid !== prevProps.nid) {
      this.fetchNode()
    }
  }

  fetchNode = () => {
    const nid = this.props.nid
    const account = this.props.account
    return smugler.node
      .get({
        nid,
        cancelToken: this.fetchNodeCancelToken.token,
        account,
      })
      .then((node) => {
        if (node) {
          this.setState({
            node,
          })
        }
      })
  }

  render() {
    if (this.state.node) {
      return <ReadDocRender node={this.state.node} />
    } else {
      return <Loader size={'medium'} />
    }
  }
}

export function ReadOnlyRender({ nid, node, ...rest }) {
  const ctx = useContext(MzdGlobalContext)
  if (node) {
    return <ReadDocRender node={node} {...rest} />
  } else {
    return <ReadOnlyRenderFetching nid={nid} account={ctx.account} {...rest} />
  }
}
