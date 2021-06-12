import React from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router-dom'

import './components.css'

import { Link as ReactRouterLink } from 'react-router-dom'

import { RichUtils, SelectionState } from 'draft-js'

import { ControlButton } from './../ControlButton'
import { ImgButton } from '../../../lib/ImgButton'

import { joinClasses } from '../../../util/elClass.js'

import { Keys, isSymbol, isHotkeyCopy } from '../../../lib/Keys.jsx'
import { ClickOutsideDetector } from '../../../lib/ClickOutsideDetector'
import { goto } from '../../../lib/route.jsx'

import CopyImg from '../../../img/copy.png'
import DeleteImg from '../../../img/delete.png'

import styles from './Link.module.css'

const lodash = require('lodash')

function onBlur() {
  // *dbg*/ console.log('onBlur')
}

function onFocus() {
  // *dbg*/ console.log('onFocus')
}

function genUrlTitle(url) {
  return lodash.truncate(url, {
    length: 128,
  })
}

export function insertPiece(piece, value, start, end) {
  if (end >= 0 && start >= 0 && start <= end) {
    return value.slice(0, start) + piece + value.slice(end)
  }
  return value + piece
}

export function deleteSelected(value, start, end) {
  if (start === end) {
    ++end
  }
  return value.slice(0, start) + value.slice(end)
}

export function backspaceSelected(value, start, end) {
  if (start === end) {
    --start
  }
  if (start < 0) {
    return value
  }
  return value.slice(0, start) + value.slice(end)
}

class LinkEditor extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      value: this.props.value,
    }
  }

  _onURLChange = (e) => {
    this.setState({ value: e.target.value })
  }

  _onLinkInputKeyDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    // *dbg*/ console.log('Input key', e)
    if (isSymbol(e.which)) {
      this.setState({
        value: insertPiece(
          e.key,
          e.target.value,
          e.target.selectionStart,
          e.target.selectionEnd
        ),
      })
    }
    if (isHotkeyCopy(e)) {
      // const value=       e.target.value;
      // const selectionStart =      e.target.selectionStart;
      // const selectionEnd =       e.target.selectionEnd;
      // TODO(akindyakov) Requires permissions to run
      // navigator.clipboard.readText().then(clipText => {
      //   this.setState({
      //     value: insertPiece(
      //       clipText,
      //       value,
      //       selectionStart,
      //       selectionEnd)
      //   });
      // });
    }
    switch (e.which) {
      case Keys.ESC:
        // Cancel
        break
      case Keys.ENTER:
        // Confirm
        break
      case Keys.BACKSPACE:
        this.setState({
          value: backspaceSelected(
            e.target.value,
            e.target.selectionStart,
            e.target.selectionEnd
          ),
        })
        break
      case Keys.DELETE:
        this.setState({
          value: deleteSelected(
            e.target.value,
            e.target.selectionStart,
            e.target.selectionEnd
          ),
        })
        break
    }
  }

  _deleteLink = (event) => {
    event.stopPropagation()
    event.preventDefault()
    const { removeLink, onClose, selection } = this.props
    removeLink(selection)
    onClose()
  }

  _confirmLink = () => {
    const { contentState, onClose, entityKey } = this.props
    const newEditorState = contentState.mergeEntityData(entityKey, {
      url: this.state.value,
    })
    onClose()
  }

  _copyLink = (event) => {
    event.stopPropagation()
    event.preventDefault()
    // *dbg*/ console.log('Copy link', event)
    // TODO(akindyakov): implement copy of current url
  }

  // https://github.com/facebook/draft-js/issues/2137

  render() {
    const { value } = this.props
    const name = genUrlTitle(value)
    return (
      <div className={styles.popover_root}>
        <div className={styles.popover}>
          <ImgButton onClick={this._copyLink} className={styles.link_btn}>
            <img src={CopyImg} className={styles.btn_img} alt={'Copy link'} />
          </ImgButton>
          <ImgButton onClick={this._deleteLink} className={styles.link_btn}>
            <img src={DeleteImg} className={styles.btn_img} alt={'Unlink'} />
          </ImgButton>
          <a href={value} className={joinClasses('doc_block_inline_link')}>
            {name}
          </a>
        </div>
      </div>
    )
  }
}

class LinkImpl extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      showEditor: false,
    }
  }

  static propTypes = {
    history: PropTypes.object.isRequired,
  }

  onMouseEnterHandler = () => {
    this.setState({ showEditor: true })
  }

  onMouseLeaveHandler = () => {
    this.setState({ showEditor: false })
  }

  toggleLinkCard = (e) => {
    const { showEditor } = this.state
    if (!showEditor) {
      e.preventDefault()
      this.setState({ showEditor: !showEditor })
    }
  }

  onEditorClose = () => {
    this.setState({ showEditor: false })
  }

  goToLink = () => {
    const { contentState, entityKey, history } = this.props
    const { url } = contentState.getEntity(entityKey).getData()
    if (url.match(/^\w+$/)) {
      goto.node({ history, nid: url })
    } else {
      window.open(url, '_blank')
    }
  }

  makeToolbar(url) {
    if (!this.state.showEditor) {
      return null
    }
    const { contentState, entityKey, removeLink, end, start, blockKey } =
      this.props
    const selection = SelectionState.createEmpty().merge({
      anchorKey: blockKey,
      anchorOffset: start,
      focusKey: blockKey,
      focusOffset: end,
      isBackward: false,
      hasFocus: false,
    })
    return (
      <LinkEditor
        value={url}
        onClose={this.onEditorClose}
        contentState={contentState}
        entityKey={entityKey}
        selection={selection}
        removeLink={removeLink}
      />
    )
  }
  // https://github.com/facebook/draft-js/issues/2137
  render() {
    const {
      contentState,
      children,
      entityKey,
      removeLink,
      end,
      start,
      blockKey,
    } = this.props
    let { url } = contentState.getEntity(entityKey).getData()
    url = url || ''
    const toolbar = this.makeToolbar(url)
    const { showEditor } = this.state
    if (url.match(/^\w+$/)) {
      return (
        <div
          className={styles.link_wrap}
          onMouseEnter={this.onMouseEnterHandler}
          onMouseLeave={this.onMouseLeaveHandler}
        >
          <div className={styles.toolbar}>{toolbar}</div>
          <ReactRouterLink
            to={url}
            className={joinClasses(
              'doc_block_inline_link',
              'doc_block_inline_link_int'
            )}
            onClick={this.goToLink}
          >
            {children}
          </ReactRouterLink>
        </div>
      )
    } else {
      return (
        <div
          className={styles.link_wrap}
          onMouseEnter={this.onMouseEnterHandler}
          onMouseLeave={this.onMouseLeaveHandler}
        >
          <div className={styles.toolbar}>{toolbar}</div>
          <a
            href={url}
            className={joinClasses(
              'doc_block_inline_link',
              'doc_block_inline_link_ext'
            )}
            onClick={this.goToLink}
          >
            {children}
          </a>
        </div>
      )
    }
  }
}

export const Link = withRouter(LinkImpl)

export function StaticLink({ contentState, entityKey, children }) {
  const { url } = contentState.getEntity(entityKey).getData()
  if (url.match(/^\w+$/)) {
    return (
      <ReactRouterLink
        to={url}
        className={joinClasses(
          'doc_block_inline_link',
          'doc_block_inline_link_int'
        )}
        onBlur={onBlur}
        onFocus={onFocus}
      >
        {children}
      </ReactRouterLink>
    )
  } else {
    return (
      <a
        href={url}
        className={joinClasses(
          'doc_block_inline_link',
          'doc_block_inline_link_ext'
        )}
      >
        {children}
      </a>
    )
  }
}
