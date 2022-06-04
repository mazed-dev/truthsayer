import {
  Editor,
  Element as SlateElement,
  Point,
  Range,
  Transforms,
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
  kSlateBlockTypeParagraph,
  kSlateBlockTypeQuote,
  kSlateBlockTypeUnorderedList,
  kSlateBlockTypeListItem,
  kSlateBlockTypeListCheckItem,
  CustomEditor,
  UnorderedListElement,
  CustomElement,
  CustomElementType,
} from '../types'

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
  '```': kSlateBlockTypeCode,
  '[]': kSlateBlockTypeListCheckItem,
  '[ ]': kSlateBlockTypeListCheckItem,
  '---': kSlateBlockTypeBreak,
}

export const withShortcuts = (editor: CustomEditor) => {
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
      const type = SHORTCUTS[
        beforeText as keyof typeof SHORTCUTS
      ] as CustomElementType

      if (type) {
        Transforms.select(editor, range)
        Transforms.delete(editor)
        const newProperties: Partial<SlateElement> = {
          type,
        }
        Transforms.setNodes<SlateElement>(editor, newProperties, {
          match: (n) => Editor.isBlock(editor, n),
        })
        if (
          type === kSlateBlockTypeListItem ||
          type === kSlateBlockTypeListCheckItem
        ) {
          const list: UnorderedListElement = {
            type: kSlateBlockTypeUnorderedList,
            children: [],
          }
          Transforms.wrapNodes(editor, list, {
            match: (n) =>
              !Editor.isEditor(n) &&
              SlateElement.isElement(n) &&
              n.type === type,
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
        const { type } = block as CustomElement

        if (
          !Editor.isEditor(block) &&
          SlateElement.isElement(block) &&
          type !== kSlateBlockTypeParagraph &&
          Point.equals(selection.anchor, start)
        ) {
          const newProperties: Partial<SlateElement> = {
            type: kSlateBlockTypeParagraph,
          }
          Transforms.setNodes(editor, newProperties)

          if (
            type === kSlateBlockTypeListItem ||
            type === kSlateBlockTypeListCheckItem
          ) {
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
