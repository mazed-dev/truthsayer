import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { Slate, Editable, withReact } from 'slate-react'
import {
  Editor,
  Transforms,
  Range,
  Point,
  createEditor,
  Element as SlateElement,
  Descendant,
} from 'slate'

import {
  kSlateDescTypeH1,
  kSlateDescTypeH2,
  kSlateDescTypeH3,
  kSlateDescTypeH4,
  kSlateDescTypeH5,
  kSlateDescTypeH6,
  kSlateDescTypeBreak,
  kSlateDescTypeCode,
  kSlateDescTypeOrderedList,
  kSlateDescTypeParagraph,
  kSlateDescTypeQuote,
  kSlateDescTypeUnorderedList,
  kSlateDescTypeListItem,
} from './types.ts'

import { getDocSlate } from './doc_util.jsx'

import { withHistory } from 'slate-history'
import { BulletedListElement } from './custom-types'

import { joinClasses } from './../util/elClass.js'

const lodash = require('lodash')

const SHORTCUTS = {
  '*': kSlateDescTypeListItem,
  '-': kSlateDescTypeListItem,
  '+': kSlateDescTypeListItem,
  '>': 'block-quote',
  '#': 'heading-one',
  '##': 'heading-two',
  '###': 'heading-three',
  '####': 'heading-four',
  '#####': 'heading-five',
  '######': 'heading-six',
}

export const DocEditor = ({ className, node, readOnly }) => {
  const { doc, nid } = node
  const [value, setValue] = useState<Descendant[]>([])
  useEffect(() => {
    getDocSlate(doc).then((content) => setValue(content))
  }, [nid])
  const renderElement = useCallback((props) => <Element {...props} />, [])
  const editor = useMemo(
    () => withShortcuts(withReact(withHistory(createEditor()))),
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

        if (type === kSlateDescTypeListItem) {
          const list: BulletedListElement = {
            type: 'bulleted-list',
            children: [],
          }
          Transforms.wrapNodes(editor, list, {
            match: (n) =>
              !Editor.isEditor(n) &&
              SlateElement.isElement(n) &&
              n.type === kSlateDescTypeListItem,
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
          block.type !== 'paragraph' &&
          Point.equals(selection.anchor, start)
        ) {
          const newProperties: Partial<SlateElement> = {
            type: 'paragraph',
          }
          Transforms.setNodes(editor, newProperties)

          if (block.type === kSlateDescTypeListItem) {
            Transforms.unwrapNodes(editor, {
              match: (n) =>
                !Editor.isEditor(n) &&
                SlateElement.isElement(n) &&
                n.type === 'bulleted-list',
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

const Element = ({ attributes, children, element }) => {
  switch (element.type) {
    case 'block-quote':
      return <blockquote {...attributes}>{children}</blockquote>
    case 'bulleted-list':
      return <ul {...attributes}>{children}</ul>
    case 'heading-one':
      return <h1 {...attributes}>{children}</h1>
    case 'heading-two':
      return <h2 {...attributes}>{children}</h2>
    case 'heading-three':
      return <h3 {...attributes}>{children}</h3>
    case 'heading-four':
      return <h4 {...attributes}>{children}</h4>
    case 'heading-five':
      return <h5 {...attributes}>{children}</h5>
    case 'heading-six':
      return <h6 {...attributes}>{children}</h6>
    case kSlateDescTypeListItem:
      return <li {...attributes}>{children}</li>
    default:
      return <p {...attributes}>{children}</p>
  }
}

const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [
      {
        text: 'The editor gives you full control over the logic you can add. For example, it\'s fairly common to want to add markdown-like shortcuts to editors. So that, when you start a line with "> " you get a blockquote that looks like this:',
      },
    ],
  },
  {
    type: 'block-quote',
    children: [{ text: 'A wise quote.' }],
  },
  {
    type: 'paragraph',
    children: [
      {
        text: 'Order when you start a line with "## " you get a level-two heading, like this:',
      },
    ],
  },
  {
    type: 'heading-two',
    children: [{ text: 'Try it out!' }],
  },
  {
    type: 'paragraph',
    children: [
      {
        text: 'Try it out for yourself! Try starting a new line with ">", "-", or "#"s.',
      },
    ],
  },
]

export default DocEditor
