import { Editor, Element, Range, Transforms } from 'slate'

import moment from 'moment'
import type { Moment } from 'moment'

import {
  kSlateBlockTypeDateTime,
  DateTimeElement,
  CustomEditor,
} from '../types'

const tryParseDate = (text: string): Moment | null => {
  return moment(text)
}

export const withDateTime = (editor: CustomEditor) => {
  const { insertData, insertText, isInline, isVoid } = editor

  editor.isInline = (element) => {
    return element.type === kSlateBlockTypeDateTime ? true : isInline(element)
  }

  editor.isVoid = (element) => {
    return element.type === kSlateBlockTypeDateTime ? true : isVoid(element)
  }

  editor.insertText = (text?: string) => {
    if (text != null) {
      const date = tryParseDate(text)
      if (date) {
        wrapDateTime(editor, text, date)
      } else {
        insertText(text)
      }
    }
  }

  editor.insertData = (data) => {
    const text = data.getData('text/plain')
    const date = tryParseDate(text)
    if (date) {
      wrapDateTime(editor, text, date)
    } else {
      insertData(data)
    }
  }

  return editor
}

// ts-ignore: will use it later
const insertDateTime = (editor: CustomEditor, text?: string) => {
  if (editor.selection && text != null) {
    const date = tryParseDate(text)
    if (date) {
      wrapDateTime(editor, text, date)
    }
  }
}

const isDateTimeActive = (editor: CustomEditor) => {
  const [element] = Editor.nodes(editor as Editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      Element.isElement(n) &&
      n.type === kSlateBlockTypeDateTime,
  })
  return !!element
}

const unwrapDateTime = (editor: CustomEditor) => {
  Transforms.unwrapNodes(editor as Editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      Element.isElement(n) &&
      n.type === kSlateBlockTypeDateTime,
  })
}

const wrapDateTime = (editor: CustomEditor, text: string, date: Moment) => {
  if (isDateTimeActive(editor)) {
    unwrapDateTime(editor)
  }

  const { selection } = editor
  const isCollapsed = selection && Range.isCollapsed(selection)
  const element: DateTimeElement = {
    type: kSlateBlockTypeDateTime,
    timestamp: date.unix(),
    children: isCollapsed ? [{ text }] : [],
  }

  if (isCollapsed) {
    Transforms.insertNodes(editor as Editor, element)
  } else {
    Transforms.wrapNodes(editor as Editor, element, { split: true })
    Transforms.collapse(editor as Editor, { edge: 'end' })
  }
}
