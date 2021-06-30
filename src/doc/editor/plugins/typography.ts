import {
  Descendant,
  Editor,
  Element as SlateElement,
  Point,
  Range,
  Transforms,
  createEditor,
  Path,
} from 'slate'

import { kSlateBlockTypeBreak, kSlateBlockTypeImage } from '../../types'
import { makeParagraph } from '../../doc_util'

import { debug } from '../../../util/log'

const lodash = require('lodash')

const TYPES_NOT_TO_BE_LAST = new Set([
  kSlateBlockTypeBreak,
  kSlateBlockTypeImage,
])

export const withTypography = (editor) => {
  const { isVoid, normalizeNode } = editor

  editor.normalizeNode = ([node, path]) => {
    if (path.length === 0) {
      const lastChild = lodash.last(editor.children)
      // Insert empty paragraph at the end, if last child is "void"
      if (editor.isVoid(lastChild)) {
        const at: Path = [editor.children.length]
        const paragraph = makeParagraph([])
        Transforms.insertNodes(editor, paragraph, { at })
      }
    }
    return normalizeNode([node, path])
  }

  editor.isVoid = (element) => {
    return element.type === kSlateBlockTypeBreak ? true : isVoid(element)
  }

  return editor
}
