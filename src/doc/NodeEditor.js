import React from 'react'
import {
  Editor,
  EditorState,
  RichUtils,
  convertToRaw,
  convertFromRaw,
  CompositeDecorator,
  getDefaultKeyBinding,
} from 'draft-js'
import 'draft-js/dist/Draft.css'

import './NodeEditor.css'
import styles from './NodeEditor.module.css'
import './editor/components/components.css'

import { joinClasses } from '../util/elClass.js'
import { Keys } from '../lib/Keys.jsx'

import {
  kBlockTypeAtomic,
  kBlockTypeCode,
  kBlockTypeH1,
  kBlockTypeH2,
  kBlockTypeH3,
  kBlockTypeH4,
  kBlockTypeH5,
  kBlockTypeH6,
  kBlockTypeHrule,
  kBlockTypeOrderedItem,
  kBlockTypeQuote,
  kBlockTypeUnorderedCheckItem,
  kBlockTypeUnorderedItem,
  kBlockTypeUnstyled,
  kEntityTypeBold,
  kEntityTypeItalic,
  kEntityTypeLink,
  kEntityTypeMonospace,
  kEntityTypeTime,
  kEntityTypeUnderline,
  kEntityTypeImage,
} from './types.jsx'

import { getBlockStyleInDoc } from './editor/components/BlockStyle'
import { Link, StaticLink } from './editor/components/Link'
import { HRule } from './editor/components/HRule'
import { Header } from './editor/components/Header'
import { CheckBox } from './editor/components/CheckBox'
import { ControlsToolbar } from './editor/ControlsToolbar'

import { getDocDraft, makeDoc } from './doc_util.jsx'

const lodash = require('lodash')

const { Map } = require('immutable')

/**
 * - Links
 *
 * Pro:
 * - Images
 * - Tables
 * - Date&time
 */

const kListMaxDepth = 4

const kCommandShiftLeft = 'tab-shift-left'
const kCommandShiftRight = 'tab-shift-right'

const blockRenderMap = Map({
  [kBlockTypeH1]: { element: 'h1' },
  [kBlockTypeH2]: { element: 'h2' },
  [kBlockTypeH3]: { element: 'h3' },
  [kBlockTypeH4]: { element: 'h4' },
  [kBlockTypeH5]: { element: 'h5' },
  [kBlockTypeH6]: { element: 'h6' },
  [kBlockTypeQuote]: { element: 'blockquote' },
  [kBlockTypeCode]: { element: 'pre' },
  [kBlockTypeAtomic]: { element: 'figure' },
  [kBlockTypeUnorderedItem]: { element: 'ul' },
  [kBlockTypeOrderedItem]: { element: 'ol' },
  [kBlockTypeUnstyled]: { element: 'div', aliasedElements: ['p'] },
})

const kHeaderLevelRotation = Map({
  [kBlockTypeH1]: kBlockTypeH2,
  [kBlockTypeH2]: kBlockTypeH3,
  [kBlockTypeH3]: kBlockTypeH4,
  [kBlockTypeH4]: kBlockTypeH5,
  [kBlockTypeH5]: kBlockTypeH6,
  [kBlockTypeH6]: kBlockTypeH1,
})

function adjustBlockDepthForContentState(
  contentState,
  selectionState,
  adjustment,
  maxDepth
) {
  const startKey = selectionState.getStartKey()
  const endKey = selectionState.getEndKey()
  let blockMap = contentState.getBlockMap()
  const blocks = blockMap
    .toSeq()
    .skipUntil((_, k) => {
      return k === startKey
    })
    .takeUntil((_, k) => {
      return k === endKey
    })
    .concat([[endKey, blockMap.get(endKey)]])
    .map((block) => {
      let depth = block.getDepth() + adjustment
      depth = Math.max(0, Math.min(depth, maxDepth))
      return block.set('depth', depth)
    })
  blockMap = blockMap.merge(blocks)
  return contentState.merge({
    blockMap,
    selectionBefore: selectionState,
    selectionAfter: selectionState,
  })
}

export class NodeEditor extends React.Component {
  constructor(props) {
    super(props)

    this.decorator = new CompositeDecorator([
      {
        strategy: findLinkEntities,
        component: Link,
        props: {
          removeLink: this._removeLink,
        },
      },
    ])
    const content = convertFromRaw(getDocDraft(this.props.doc))
    this.state = {
      editorState: EditorState.createWithContent(content, this.decorator),
      showControlsToolbar: false,
    }
  }

  componentDidMount() {}

  componentDidUpdate(prevProps) {
    if (this.props.nid !== prevProps.nid) {
      const content = convertFromRaw(getDocDraft(this.props.doc))
      const editorState = EditorState.createWithContent(content, this.decorator)
      this.setState({ editorState }) // eslint-disable-line react/no-did-update-set-state
    }
  }

  onChange = (editorState) => {
    this.setState({ editorState })
    this.saveContent(editorState.getCurrentContent())
  }

  saveContent = lodash.debounce((content) => {
    const { saveDoc } = this.props
    const draft = convertToRaw(content)
    /* dbg*/ console.log('Draft', draft)
    saveDoc(makeDoc({ draft }))
    // TODO(akindyakov): Collect stats here
  }, 1200)

  focus = () => {
    this.editorRef.focus()
    this.setState({ showControlsToolbar: true })
  }

  onBlur = () => {
    this.setState({ showControlsToolbar: false })
  }

  _removeLink = (selection) => {
    if (!selection.isCollapsed()) {
      const newEditorState = RichUtils.toggleLink(
        this.state.editorState,
        selection,
        null
      )
      this.onChange(newEditorState)
    }
  }

  updateBlockMetadata = (blockKey, metadata) => {
    let contentState = this.state.editorState.getCurrentContent()
    let updatedBlock = contentState.getBlockForKey(blockKey)
    updatedBlock = updatedBlock.mergeDeep(metadata)

    let blockMap = contentState.getBlockMap()
    blockMap = blockMap.merge({ [blockKey]: updatedBlock })
    contentState = contentState.merge({ blockMap })

    const newEditorState = EditorState.push(
      this.state.editorState,
      contentState,
      'metadata-update'
    )
    this.onChange(newEditorState)
  }

  myBlockRenderer = (contentBlock) => {
    const type = contentBlock.getType()
    //* dbg*/ console.log("Type ", type);
    switch (type) {
      case kBlockTypeUnorderedCheckItem:
        return {
          component: CheckBox,
          props: {
            updateMetadataFn: this.updateBlockMetadata,
          },
        }
      case kBlockTypeHrule:
        return {
          component: HRule,
        }
      default:
        return
    }
  }

  keyBindingFn = (event) => {
    // we press CTRL + K => return 'bbbold'
    // we use hasCommandModifier instead of checking for CTRL keyCode because different OSs have different command keys
    // if (KeyBindingUtil.hasCommandModifier(event) && event.keyCode === 75) { return 'bbbold'; }
    if (event.keyCode === Keys.TAB) {
      return event.shiftKey ? kCommandShiftLeft : kCommandShiftRight
    }
    // manages usual things, like: Ctrl+Z => return 'undo'
    return getDefaultKeyBinding(event)
  }

  handleKeyCommand = (command) => {
    const { editorState } = this.state
    let newState
    if (command === kCommandShiftRight || command === kCommandShiftLeft) {
      newState = this._onTab(command)
    } else {
      newState = RichUtils.handleKeyCommand(editorState, command)
    }
    if (newState) {
      this.onChange(newState)
      return true
    }
    return false
  }

  _onTab = (cmd) => {
    const { editorState } = this.state
    const selection = editorState.getSelection()
    const key = selection.getAnchorKey()

    if (key !== selection.getFocusKey()) {
      return editorState
    }

    const content = editorState.getCurrentContent()
    const block = content.getBlockForKey(key)
    const type = block.getType()

    if (type !== kBlockTypeUnorderedItem && type !== kBlockTypeOrderedItem) {
      return
    }

    // event.preventDefault();
    const depth = block.getDepth()
    let shift
    if (cmd === kCommandShiftLeft) {
      if (depth === 0) {
        return
      }
      shift = -1
    } else if (cmd === kCommandShiftRight) {
      if (depth === kListMaxDepth) {
        return
      }
      shift = 1
    }
    const withAdjustment = adjustBlockDepthForContentState(
      content,
      selection,
      shift,
      kListMaxDepth
    )
    return EditorState.push(editorState, withAdjustment, 'adjust-depth')
  }

  blockStyleFn_ = (block) => {
    return getBlockStyleInDoc(block.getType())
  }

  toggleBlockType = (blockType) => {
    this.onChange(RichUtils.toggleBlockType(this.state.editorState, blockType))
  }
  toggleInlineStyle = (inlineStyle) => {
    this.onChange(
      RichUtils.toggleInlineStyle(this.state.editorState, inlineStyle)
    )
  }
  render() {
    const { editorState } = this.state
    // If the user changes block type before entering any text, we can
    //     // either style the placeholder or hide it. Let's just hide it now.
    const className = styles.editor
    const contentState = editorState.getCurrentContent()
    // if (!contentState.hasText()) {
    //   if (contentState.getBlockMap().first().getType() !== kBlockTypeUnstyled) {
    // className += " RichEditor-hidePlaceholder";
    //   }
    // }
    // https://project-awesome.org/nikgraf/awesome-draft-js

    const controlsToolbarClassName = this.state.showControlsToolbar
      ? styles.controls_toolbar_show
      : styles.controls_toolbar_show
    //
    return (
      <div className={styles.root}>
        <div className={className} onClick={this.focus}>
          <Editor
            blockStyleFn={this.blockStyleFn_}
            blockRendererFn={this.myBlockRenderer}
            customStyleMap={kStyleMap}
            editorState={editorState}
            handleKeyCommand={this.handleKeyCommand}
            keyBindingFn={this.keyBindingFn}
            onChange={this.onChange}
            placeholder="Tell a story..."
            ref={(x) => (this.editorRef = x)}
          />
        </div>
        <ControlsToolbar
          editorState={editorState}
          toggleBlockType={this.toggleBlockType}
          toggleInlineStyle={this.toggleInlineStyle}
          onStateChange={this.onChange}
          focusBack={this.focus}
          className={controlsToolbarClassName}
        />
      </div>
    )
  }
}

export class StaticNode extends React.Component {
  constructor(props) {
    super(props)
    this.decorator = new CompositeDecorator([
      {
        strategy: findLinkEntities,
        component: StaticLink,
      },
    ])
    const content = convertFromRaw(getDocDraft(this.props.doc))
    this.state = {
      editorState: EditorState.createWithContent(content, this.decorator),
      showControlsToolbar: false,
    }
  }

  myBlockRenderer = (contentBlock) => {
    const type = contentBlock.getType()
    switch (type) {
      case kBlockTypeUnorderedCheckItem:
        return {
          component: CheckBox,
          props: { readOnly: true },
        }
      case kBlockTypeHrule:
        return {
          component: HRule,
        }
      case kBlockTypeH1:
        return {
          component: Header,
          props: {
            nid: this.props.nid,
          },
        }
      default:
        return
    }
  }

  blockStyleFn_ = (block) => {
    return getBlockStyleInDoc(block.getType())
  }

  render() {
    const { editorState } = this.state
    return (
      <div className={styles.small_root}>
        <Editor
          blockStyleFn={this.blockStyleFn_}
          blockRendererFn={this.myBlockRenderer}
          customStyleMap={kStyleMap}
          editorState={editorState}
          ref={(x) => (this.editorRef = x)}
          readOnly
        />
      </div>
    )
  }
}

// Custom overrides for "code" style.
const kStyleMap = {
  CODE: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    fontFamily: '"Inconsolata", "Menlo", "Consolas", monospace',
    fontSize: 16,
    padding: 2,
  },
}

function findLinkEntities(contentBlock, callback, contentState) {
  contentBlock.findEntityRanges((character) => {
    const entityKey = character.getEntity()
    return (
      entityKey !== null &&
      contentState.getEntity(entityKey).getType() === kEntityTypeLink
    )
  }, callback)
}

// https://codesandbox.io/s/qw1rqjbll?file=/RichEditor.js:2700-4565
// https://sendgrid.com/blog/how-we-use-draft-js-at-sendgrid/
