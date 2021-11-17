import React from 'react'

import styles from './doc.module.css'

import PropTypes from 'prop-types'
import { withRouter } from 'react-router-dom'

import { Loader } from '../lib/loader'

import { jcss } from 'elementary'

import { ChunkRender, parseRawSource } from './chunks'

import { mergeChunks, makeEmptyChunk } from './chunk_util'
import { extractDocAsMarkdown } from './doc_util'

import { Card } from 'react-bootstrap'

import { FullCardFootbar } from './../card/FullCardFootbar'
import { AuthorFooter } from './../card/AuthorBadge'

class DocRenderImpl extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      edit_chunk_opts: {
        index: this.isEditingStart() ? 0 : -1,
        begin: 0,
        end: 0,
      },
    }
  }

  static propTypes = {
    location: PropTypes.object.isRequired,
  }

  updateNode = (doc, toIndex, selectionStart) => {
    const length = doc.chunks.length
    if (toIndex != null) {
      if (length > 0 && toIndex >= length) {
        toIndex = length - 1
      }
    } else {
      toIndex = -1
    }
    const editOpts = {
      index: toIndex,
      begin: selectionStart || 0,
      end: selectionStart || 0,
    }
    this.setState({
      edit_chunk_opts: editOpts,
    })
    return this.props.updateNode(doc)
  }

  editChunk = (index, begin, end) => {
    index = index || 0
    const length = this.props.node.doc.chunks.length
    if (length > 0 && index >= length) {
      index = length - 1
    }
    this.setState({
      edit_chunk_opts: {
        index,
        begin: begin || 0,
        end: end || 0,
      },
    })
  }

  // Chunks operations:
  // - Save and exit
  // - Go to the chunk above
  // - Go to the chunk below
  // - Split the chunk into two
  // - Merge the chunk with one above
  //
  // Basic opetaions:
  // - Insert
  // - Merge
  // - Go to or exit editing mode

  /**
   * Repace the chunk with index [index] with new chunks
   */
  replaceChunk = (chunks, index, toIndex, selectionStart) => {
    // TODO(akindyakov): Use Array.splice instead
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
    const newChunks = this.props.node.doc.chunks
      .slice(0, index)
      .concat(chunks)
      .concat(this.props.node.doc.chunks.slice(index + 1))
    const newDoc = {
      chunks: newChunks,
    }
    return this.updateNode(newDoc, toIndex, selectionStart)
  }

  /**
   * Merge the chunk with one above
   */
  mergeChunkUp = (chunk, index, toIndex, selectionStart) => {
    if (index === 0) {
      // Nothing to merge with, just replace the current one
      return this.replaceChunk([chunk], index, toIndex, selectionStart)
    }
    const prevIndex = index - 1
    const newChunk = mergeChunks(this.props.node.doc.chunks[prevIndex], chunk)
    if (selectionStart !== null && selectionStart < 0) {
      selectionStart = newChunk.source.length + selectionStart
    }
    const newChunks = this.props.node.doc.chunks
      .slice(0, prevIndex)
      .concat([newChunk])
      .concat(this.props.node.doc.chunks.slice(index + 1))
    const newDoc = {
      chunks: newChunks,
    }
    return this.updateNode(newDoc, toIndex, selectionStart)
  }

  isEditingStart() {
    return false // this.props.location.state && this.props.location.state.edit;
  }

  getDocAsMarkdown = () => {
    const md = extractDocAsMarkdown(this.props.node.doc)
    return md
  }

  render() {
    let body = null
    let isOwnedByUser = false
    if (this.props.node && this.props.node.doc) {
      const chunks =
        this.props.node.doc.chunks && this.props.node.doc.chunks.length > 0
          ? this.props.node.doc.chunks
          : [makeEmptyChunk()]
      const account = this.context.account
      isOwnedByUser = this.props.node.isOwnedBy(account)
      const edit_chunk_opts = this.state.edit_chunk_opts
      body = chunks.map((chunk, index) => {
        const key = index.toString()
        const editOpts =
          index === edit_chunk_opts.index ? edit_chunk_opts : null
        return (
          <ChunkRender
            chunk={chunk}
            key={key}
            nid={this.props.node.nid}
            index={index}
            replaceChunk={this.replaceChunk}
            editChunk={this.editChunk}
            editOpts={editOpts}
            isEditable={isOwnedByUser}
          />
        )
      })
      if (!body) {
        const index = body.length
        body.push(
          <ChunkRender
            chunk={makeEmptyChunk()}
            key={index.toString()}
            nid={this.props.node.nid}
            index={index}
            replaceChunk={this.replaceChunk}
            editChunk={this.editChunk}
            editOpts={null}
            isEditable={isOwnedByUser}
          />
        )
      }
    } else {
      // TODO(akindyakov): Add loading animation here
      body = <Loader />
    }

    const footbar = (
      <FullCardFootbar
        addRef={this.props.addRef}
        node={this.props.node}
        stickyEdges={this.props.stickyEdges}
        getMarkdown={this.getDocAsMarkdown}
        reloadNode={this.fetchNode}
      />
    )
    return (
      <Card className={jcss(styles.fluid_container, styles.doc_render_card)}>
        <Card.Body className={jcss(styles.doc_render_card_body)}>
          {body}
        </Card.Body>
        <AuthorFooter node={this.props.node} />
        {footbar}
      </Card>
    )
  }
}

// DocRender.contextType = MzdGlobalContext;

export const DocRender = withRouter(DocRenderImpl)

export function exctractDoc(source, nid): TDoc {
  // TODO(akindyakov): add encryption here - decrypt
  if (typeof source === 'object') {
    return source
  }
  try {
    return JSON.parse(source)
  } catch (e) {
    // console.log("Old style doc without mark up", nid);
  }
  return parseRawSource(source)
}

export function createEmptyDoc() {
  const doc: TDoc = {
    chunks: [],
    encrypted: false,
  }
  return doc
}
