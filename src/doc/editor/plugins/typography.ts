import { kSlateBlockTypeBreak } from '../../types'

export const withTypography = (editor) => {
  const { isVoid } = editor

  editor.isVoid = (element) => {
    return element.type === kSlateBlockTypeBreak ? true : isVoid(element)
  }

  return editor
}
