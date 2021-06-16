import React, { useState, useCallback, useMemo, useEffect } from 'react'
import {
  Editable,
  ReactEditor,
  Slate,
  useReadOnly,
  useSlateStatic,
  withReact,
} from 'slate-react'
import {
  Descendant,
  Editor,
  Element as SlateElement,
  Point,
  Range,
  Transforms,
  createEditor,
} from 'slate'

import {
  kSlateBlockTypeH1,
  kSlateBlockTypeH2,
  kSlateBlockTypeH3,
  kSlateBlockTypeH4,
  kSlateBlockTypeH5,
  kSlateBlockTypeH6,
  kSlateBlockTypeBreak,
  kSlateBlockTypeCode,
  kSlateBlockTypeOrderedList,
  kSlateBlockTypeParagraph,
  kSlateBlockTypeQuote,
  kSlateBlockTypeUnorderedList,
  kSlateBlockTypeListItem,
  kSlateBlockTypeDateTime,
} from './types'

import { getDocSlate } from './doc_util.jsx'

import { withHistory } from 'slate-history'
import { BulletedListElement } from './custom-types'

import { joinClasses } from './../util/elClass.js'
import { debug } from './../util/log'

import styles from './DocEditor.module.css'

const lodash = require('lodash')

const SHORTCUTS = {
  '*': kSlateBlockTypeListItem,
  '-': kSlateBlockTypeListItem,
  '+': kSlateBlockTypeListItem,
  '>': kSlateBlockTypeQuote,
  '#': kSlateBlockTypeH1,
  '##': kSlateBlockTypeH2,
  '###': kSlateBlockTypeH3,
  '####': kSlateBlockTypeH4,
  '#####': kSlateBlockTypeH5,
  '######': kSlateBlockTypeH6,
}

export const DocEditor = ({ className, node, readOnly }) => {
  const { doc, nid } = node
  const [value, setValue] = useState<Descendant[]>([])
  useEffect(() => {
    getDocSlate(doc).then((content) => setValue(content))
  }, [nid])
  const renderElement = useCallback((props) => <Element {...props} />, [])
  const editor = useMemo(
    () => withChecklists(withShortcuts(withReact(withHistory(createEditor())))),
    []
  )
  return (
    <div className={className}>
      <Slate
        editor={editor}
        value={value}
        onChange={(value) => setValue(value)}
      >
        <Editable
          renderElement={renderElement}
          placeholder="Write some markdown..."
          spellCheck
          autoFocus
        />
      </Slate>
    </div>
  )
}

const withShortcuts = (editor) => {
  const { deleteBackward, insertText } = editor

  editor.insertText = (text) => {
    const { selection } = editor

    if (text === ' ' && selection && Range.isCollapsed(selection)) {
      const { anchor } = selection
      const block = Editor.above(editor, {
        match: (n) => Editor.isBlock(editor, n),
      })
      const path = block ? block[1] : []
      const start = Editor.start(editor, path)
      const range = { anchor, focus: start }
      const beforeText = Editor.string(editor, range)
      const type = SHORTCUTS[beforeText]

      if (type) {
        Transforms.select(editor, range)
        Transforms.delete(editor)
        const newProperties: Partial<SlateElement> = {
          type,
        }
        Transforms.setNodes(editor, newProperties, {
          match: (n) => Editor.isBlock(editor, n),
        })

        if (type === kSlateBlockTypeListItem) {
          const list: BulletedListElement = {
            type: kSlateBlockTypeUnorderedList,
            children: [],
          }
          Transforms.wrapNodes(editor, list, {
            match: (n) =>
              !Editor.isEditor(n) &&
              SlateElement.isElement(n) &&
              n.type === kSlateBlockTypeListItem,
          })
        }

        return
      }
    }

    insertText(text)
  }

  editor.deleteBackward = (...args) => {
    const { selection } = editor

    if (selection && Range.isCollapsed(selection)) {
      const match = Editor.above(editor, {
        match: (n) => Editor.isBlock(editor, n),
      })

      if (match) {
        const [block, path] = match
        const start = Editor.start(editor, path)

        if (
          !Editor.isEditor(block) &&
          SlateElement.isElement(block) &&
          block.type !== kSlateBlockTypeParagraph &&
          Point.equals(selection.anchor, start)
        ) {
          const newProperties: Partial<SlateElement> = {
            type: kSlateBlockTypeParagraph,
          }
          Transforms.setNodes(editor, newProperties)

          if (block.type === kSlateBlockTypeListItem) {
            Transforms.unwrapNodes(editor, {
              match: (n) =>
                !Editor.isEditor(n) &&
                SlateElement.isElement(n) &&
                n.type === kSlateBlockTypeUnorderedList,
              split: true,
            })
          }

          return
        }
      }

      deleteBackward(...args)
    }
  }

  return editor
}

const withChecklists = (editor) => {
  const { deleteBackward } = editor

  editor.deleteBackward = (...args) => {
    const { selection } = editor

    if (selection && Range.isCollapsed(selection)) {
      const [match] = Editor.nodes(editor, {
        match: (n) =>
          !Editor.isEditor(n) &&
          SlateElement.isElement(n) &&
          !lodash.isUndefined(n.checked),
      })

      if (match) {
        const [, path] = match
        const start = Editor.start(editor, path)

        if (Point.equals(selection.anchor, start)) {
          const newProperties: Partial<SlateElement> = {
            type: kSlateBlockTypeParagraph,
          }
          Transforms.setNodes(editor, newProperties, {
            match: (n) =>
              !Editor.isEditor(n) &&
              SlateElement.isElement(n) &&
              !lodash.isUndefined(n.checked),
          })
          return
        }
      }
    }

    deleteBackward(...args)
  }

  return editor
}

const CheckListItemElement = ({ attributes, children, element }) => {
  const editor = useSlateStatic()
  const readOnly = useReadOnly()
  const { checked } = element
  const checkLineStyle = checked
    ? styles.check_line_span_checked
    : styles.check_line_span
  return (
    <div {...attributes} className={styles.check_item_span}>
      <span contentEditable={false} className={styles.check_box_span}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => {
            const path = ReactEditor.findPath(editor, element)
            const newProperties: Partial<SlateElement> = {
              checked: event.target.checked,
            }
            Transforms.setNodes(editor, newProperties, { at: path })
          }}
        />
      </span>
      <span
        contentEditable={!readOnly}
        suppressContentEditableWarning
        className={checkLineStyle}
      >
        {children}
      </span>
    </div>
  )
}

const Element = ({ attributes, children, element }) => {
  switch (element.type) {
    case kSlateBlockTypeQuote:
      return <blockquote {...attributes}>{children}</blockquote>
    case kSlateBlockTypeUnorderedList:
      return <ul {...attributes}>{children}</ul>
    case kSlateBlockTypeH1:
      return <h1 {...attributes}>{children}</h1>
    case kSlateBlockTypeH2:
      return <h2 {...attributes}>{children}</h2>
    case kSlateBlockTypeH3:
      return <h3 {...attributes}>{children}</h3>
    case kSlateBlockTypeH4:
      return <h4 {...attributes}>{children}</h4>
    case kSlateBlockTypeH5:
      return <h5 {...attributes}>{children}</h5>
    case kSlateBlockTypeH6:
      return <h6 {...attributes}>{children}</h6>
    case kSlateBlockTypeListItem:
      if (lodash.isUndefined(element.checked)) {
        return <li {...attributes}>{children}</li>
      } else {
        return (
          <CheckListItemElement attributes={attributes} element={element}>
            {children}
          </CheckListItemElement>
        )
      }
    case kSlateBlockTypeParagraph:
      return <p {...attributes}>{children}</p>
    default:
      return <span {...attributes}>{children}</span>
  }
}

const initialValue: Descendant[] = [
  {
    type: kSlateBlockTypeParagraph,
    children: [
      {
        text: 'The editor gives you full control over the logic you can add. For example, it\'s fairly common to want to add markdown-like shortcuts to editors. So that, when you start a line with "> " you get a blockquote that looks like this:',
      },
    ],
  },
  {
    type: kSlateBlockTypeQuote,
    children: [{ text: 'A wise quote.' }],
  },
  {
    type: kSlateBlockTypeParagraph,
    children: [
      {
        text: 'Order when you start a line with "## " you get a level-two heading, like this:',
      },
    ],
  },
  {
    type: kSlateBlockTypeH2,
    children: [{ text: 'Try it out!' }],
  },
  {
    type: kSlateBlockTypeParagraph,
    children: [
      {
        text: 'Try it out for yourself! Try starting a new line with ">", "-", or "#"s.',
      },
    ],
  },
]

export default DocEditor
