import React from 'react'

import { smuggler } from 'smuggler-api'
import keycode from 'keycode'

import styles from './chunks.module.css'

import { Button, ButtonGroup, InputGroup, Form } from 'react-bootstrap'

import { AutocompleteWindow } from './../smartpoint/AutocompleteWindow'
import { MarkdownToolbar } from './MarkdownToolBar.js'
import { jcss } from '../util/jcss'
import { renderMdCard, SmallAsterisk } from './../markdown/MarkdownRender'

import { MzdGlobalContext } from './../lib/global'

import { parseRawSource as _parseRawSource } from './mdRawParser'
import { makeChunk, isTextChunk, isAsteriskChunk } from './chunk_util'

import { HoverTooltip } from './../lib/tooltip'

import EditButtonImg from './img/edit-button.png'
import EditMoreButtonImg from './img/edit-more-button.png'

export const parseRawSource = _parseRawSource

class ChunkRenderToolbar extends React.Component {
  makeMoreTooling() {
    if (!this.props.isFull) {
      return null
    }
    return null
  }

  render() {
    return (
      <ButtonGroup vertical>
        <Button
          variant="light"
          onClick={this.props.enableEditMode}
          className={jcss(styles.paragraph_toolbar_btn)}
        >
          <HoverTooltip tooltip={'Edit'}>
            <img
              src={EditButtonImg}
              className={styles.btn_img}
              alt={'Edit paragraph'}
            />
          </HoverTooltip>
        </Button>
        {this.makeMoreTooling()}
      </ButtonGroup>
    )
  }
}

export class ChunkRender extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hover: false,
    }
  }

  onHover = () => {
    this.setState({ hover: true })
  }

  offHover = () => {
    this.setState({ hover: false })
  }

  enableEditMode = () => {
    this.props.editChunk(this.props.index)
  }

  render() {
    // &#x270E;
    const toolbar =
      !this.props.edit && this.props.isEditable ? (
        <ChunkRenderToolbar
          enableEditMode={this.enableEditMode}
          isFull={this.state.hover}
        />
      ) : null
    const card =
      this.props.editOpts != null ? (
        <TextEditor
          value={this.props.chunk.source}
          nid={this.props.nid}
          replaceChunk={this.props.replaceChunk}
          editChunk={this.props.editChunk}
          index={this.props.index}
          editOpts={this.props.editOpts}
        />
      ) : (
        <ChunkView
          nid={this.props.nid}
          chunk={this.props.chunk}
          index={this.props.index}
          replaceChunk={this.props.replaceChunk}
          render={renderMdCard}
        />
      )
    return (
      <div
        className={jcss(styles.fluid_container)}
        onMouseEnter={this.onHover}
        onMouseLeave={this.offHover}
      >
        <div className={jcss(styles.fluid_paragraph_toolbar)}>{toolbar}</div>
        {card}
      </div>
    )
  }
}

export function ChunkView({
  chunk,
  nid,
  index,
  replaceChunk,
  render,
  ...rest
}) {
  if (isTextChunk(chunk)) {
    return render({
      source: chunk.source,
      nid,
      update: (source) => {
        const { chunks } = parseRawSource(source)
        replaceChunk(chunks, index)
      },
    })
  } else if (isAsteriskChunk(chunk)) {
    return <SmallAsterisk nid={nid} />
  }
  return <></>
}

const kEditorLineHeightPx = 38
const kMinEditorHeightPx = kEditorLineHeightPx + 2

export class TextEditor extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      value: this.props.value,
      height: this.getInitialHeight(this.props.value),
      modalShow: false,
      keyCounterSlash: 0,
    }
    this.textAreaRef = React.createRef()
    this.addNodeRefAbortController = new AbortController()
  }

  componentDidMount() {
    this.textAreaRef.current.focus()

    const editOpts = this.props.editOpts
    if (editOpts.begin) {
      const begin = editOpts.begin
      const end = editOpts.end || begin
      this.textAreaRef.current.setSelectionRange(begin, end)
    }

    const topbar = this.context.topbar
    topbar.reset(this.createEditorToolbar())
  }

  componentWillUnmount() {
    this.addNodeRefAbortController.abort()

    const topbar = this.context.topbar
    topbar.reset(null)
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.value !== prevProps.value) {
      if (this.state.value !== this.props.value) {
        const { value } = this.props
        this.setState({ value }) // eslint-disable-line react/no-did-update-set-state
      }
    }
    if (this.state.value !== prevState.value) {
      this.adjustHeight()
    }
  }

  updateValue(value) {
    this.setState({
      value: this.props.value,
    })
  }

  createEditorToolbar() {
    return (
      <MarkdownToolbar
        textAreaRef={this.textAreaRef}
        updateText={this.updateText}
      />
    )
  }

  handleKeyDown = (event) => {
    const key = event.key
    const keyCode = event.keyCode
    const textRef = this.textAreaRef.current
    if (textRef == null) {
      return
    }
    if (key === '/') {
      const prefix = textRef.value.slice(0, textRef.selectionStart)
      if (prefix.endsWith('/')) {
        event.preventDefault()
        this.setState({
          modalShow: true,
        })
      }
    } else if (
      keyCode === keycode('enter') &&
      textRef.selectionStart === textRef.selectionEnd
    ) {
      let prefix = textRef.value.slice(0, textRef.selectionStart) // TODO(akindyakov) selectionStart+1 ?
      if (prefix.endsWith('\n\n')) {
        // TODO(akindyakov): Big question 2 or 3?
        prefix = prefix.trim()
        if (prefix.length > 0) {
          event.preventDefault()
          const suffix = textRef.value.slice(textRef.selectionStart)
          const topChunk = makeChunk(prefix)
          const bottomChunk = makeChunk(suffix.trim())
          const goToIndex = this.props.index + 1
          this.props.replaceChunk(
            [topChunk, bottomChunk],
            this.props.index,
            goToIndex
          )
        }
      }
    } else if (
      this.props.index !== 0 &&
      keyCode === keycode('up') &&
      textRef.selectionStart === 0 &&
      textRef.selectionEnd === 0
    ) {
      event.preventDefault()
      const { chunks } = parseRawSource(this.state.value)
      const goToIndex = this.props.index - 1
      this.props.replaceChunk(chunks, this.props.index, goToIndex)
    } else if (
      keyCode === keycode('down') &&
      textRef.textLength === textRef.selectionStart &&
      textRef.textLength === textRef.selectionEnd
    ) {
      event.preventDefault()
      const { chunks } = parseRawSource(this.state.value)
      const goToIndex = this.props.index + 1
      this.props.replaceChunk(chunks, this.props.index, goToIndex)
    }
  }

  handleChange = (event) => {
    const value = event.target.value
    const ref = event.target
    this.setState({
      value,
    })
  }

  updateText = (value, cursorPosBegin, cursorPosEnd) => {
    this.setState(
      {
        value,
      },
      () => {
        this.textAreaRef.current.focus()
        // if (cursorPosBegin) {
        //   if (!cursorPosEnd) {
        //     cursorPosEnd = cursorPosBegin;
        //   }
        //   this.textAreaRef.current.setSelectionRange(
        //     cursorPosBegin,
        //     cursorPosEnd
        //   );
        // }
      }
    )
  }

  handleReplaceSmartpoint = (replacement) => {
    if (this.textAreaRef.current && this.textAreaRef.current.selectionStart) {
      const cursorPosEnd = this.textAreaRef.current.selectionStart
      const cursorPosBegin = cursorPosEnd - 1
      const replacementLen = replacement.length
      this.setState(
        (state) => {
          // A beginning without smarpoint spell (/)
          const beginning = state.value.slice(0, cursorPosBegin)
          // Just an ending
          const ending = state.value.slice(cursorPosEnd)
          return {
            value: beginning + replacement + ending,
            modalShow: false,
          }
        },
        () => {
          // Selection of the inserted text piece
          this.textAreaRef.current.focus()
          // this.textAreaRef.current.setSelectionRange(
          //   cursorPosBegin,
          //   cursorPosBegin + replacementLen
          // );
        }
      )
    }
  }

  handleSmartpointOnInsert = ({ replacement, nid }) => {
    if (nid) {
      smuggler.edge
        .create({
          from: this.props.nid,
          to: nid,
          signal: this.addNodeRefAbortController.signal,
        })
        .then((edge) => {
          this.handleReplaceSmartpoint(replacement)
        })
    } else {
      this.handleReplaceSmartpoint(replacement)
    }
  }

  getInitialHeight = (text) => {
    const eols = text.match(/\n/g)
    const numberOfLines = eols ? eols.length + 1 : 1
    const numberOfLinesByTextLength = text.length / 62

    return Math.max(
      Math.max(numberOfLines, numberOfLinesByTextLength) * kEditorLineHeightPx,
      kMinEditorHeightPx
    )
  }

  getAdjustedHeight = () => {
    const el = this.textAreaRef.current
    // compute the height difference which is caused by border and outline
    const outerHeight = parseInt(window.getComputedStyle(el).height, 10)
    const diff = outerHeight - el.clientHeight
    // set the height to 0 in case of it has to be shrinked
    // el.style.height = 0;
    // el.scrollHeight is the full height of the content, not just the visible part
    return Math.max(kMinEditorHeightPx, el.scrollHeight + diff)
  }

  adjustHeight = () => {
    this.setState({
      height: this.getAdjustedHeight(),
    })
  }

  _saveAndQuitEditing = () => {
    const { chunks } = parseRawSource(this.state.value)
    this.props.replaceChunk(chunks, this.props.index)
    this.props.editChunk(-1)
  }

  showModal = () => {
    this.setState({ modalShow: true })
  }

  hideModal = () => {
    this.setState({ modalShow: false })
    this.textAreaRef.current.focus()
  }

  render() {
    return (
      <>
        <AutocompleteWindow
          show={this.state.modalShow}
          onHide={this.hideModal}
          on_insert={this.handleSmartpointOnInsert}
          nid={this.props.nid}
        />
        <ExtClickDetector
          callback={this._saveAndQuitEditing}
          isActive={!this.state.modalShow}
        >
          <InputGroup className={jcss(styles.editor_input_group)}>
            <Form.Control
              as="textarea"
              aria-label="With textarea"
              className={styles.editor_form}
              value={this.state.value}
              onChange={this.handleChange}
              onKeyDown={this.handleKeyDown}
              style={{ height: `${this.state.height}px` }}
              ref={this.textAreaRef}
            />
          </InputGroup>
        </ExtClickDetector>
      </>
    )
  }
}

// TextEditor.contextType = MzdGlobalContext;

class ExtClickDetector extends React.Component {
  constructor(props) {
    super(props)
    this.selfRef = React.createRef()
  }
  componentDidMount() {
    document.addEventListener('mousedown', this.handleClick, {
      capture: false,
      passive: true,
    })
  }
  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClick, {
      capture: false,
    })
  }
  handleClick = (event) => {
    if (
      this.props.isActive &&
      !this.selfRef.current.contains(event.target) &&
      !event.target.classList.contains('ignoreextclick')
    ) {
      this.props.callback(event)
    }
  }
  render() {
    return <div ref={this.selfRef}>{this.props.children}</div>
  }
}
