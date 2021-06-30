import {
  Descendant,
  Editor,
  Element as SlateElement,
  Point,
  Range,
  Transforms,
  createEditor,
} from 'slate'

import isUrl from 'is-url'

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
  kSlateBlockTypeListCheckItem,
  kSlateBlockTypeDateTime,
  kSlateBlockTypeLink,
  kSlateBlockTypeImage,
  DateTimeElement,
  ImageElement,
  LinkElement,
} from '../../types'

import { debug } from '../../../util/log'
import { Optional } from '../../../util/types'

export const withLinks = (editor) => {
  const { insertData, insertText, isInline } = editor

  editor.isInline = (element) => {
    return element.type === kSlateBlockTypeLink ? true : isInline(element)
  }

  editor.insertText = (text) => {
    if (text && isUrl(text)) {
      wrapLink(editor, text)
    } else {
      insertText(text)
    }
  }

  editor.insertData = (data) => {
    const text = data.getData('text/plain')

    if (text && isUrl(text)) {
      wrapLink(editor, text)
    } else {
      insertData(data)
    }
  }

  return editor
}

const insertLink = (editor, url) => {
  if (editor.selection) {
    wrapLink(editor, url)
  }
}

const isLinkActive = (editor) => {
  const [link] = Editor.nodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      n.type === kSlateBlockTypeLink,
  })
  return !!link
}

const unwrapLink = (editor) => {
  Transforms.unwrapNodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      n.type === kSlateBlockTypeLink,
  })
}

const wrapLink = (editor, link) => {
  if (isLinkActive(editor)) {
    unwrapLink(editor)
  }
  const nid = getPageFromLink(link)
  if (nid != null) {
    link = nid
  }
  const { selection } = editor
  const isCollapsed = selection && Range.isCollapsed(selection)
  const element: LinkElement = {
    type: kSlateBlockTypeLink,
    link,
    children: isCollapsed ? [{ text: link }] : [],
    page: nid != null,
  }

  if (isCollapsed) {
    Transforms.insertNodes(editor, element)
  } else {
    Transforms.wrapNodes(editor, element, { split: true })
    Transforms.collapse(editor, { edge: 'end' })
  }
}

const getPageFromLink = (link: string): Optional<string> => {
  try {
    const url = new URL(link)
    const isPage =
      url.host === window.location.host &&
      url.pathname.slice(0, 3).toLowerCase() === '/n/'
    if (isPage) {
      // '/n/qwerty/ert/...' -> ['', 'n', 'qwerty'] -> 'qwerty'
      return url.pathname.split('/', 3)[2]
    }
  } catch (err) {
    debug('getPageFromLink error', err)
  }
  return null
}
