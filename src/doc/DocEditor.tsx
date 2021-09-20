import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { Editable, Slate, withReact } from 'slate-react'
import {
  Descendant,
  Editor,
  Element as SlateElement,
  Point,
  Range,
  Transforms,
  createEditor,
} from 'slate'

import imageExtensions from 'image-extensions'
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
} from './types'

import { getDocSlate, makeDoc } from './doc_util'

import { withHistory } from 'slate-history'

import { jcss } from './../util/jcss'
import { debug } from './../util/log'
import { Optional } from './../util/types'

import { withJinn, Jinn } from './editor/plugins/jinn'
import { withTypography } from './editor/plugins/typography'
import { withShortcuts } from './editor/plugins/shortcuts'
import { withLinks } from './editor/plugins/link'

import {
  Header1,
  Header2,
  Header3,
  Header4,
  Header5,
  Header6,
} from './editor/components/Header'

import { HRule } from './editor/components/HRule'
import { BlockQuote } from './editor/components/BlockQuote'
import { CodeBlock } from './editor/components/CodeBlock'
import { Paragraph } from './editor/components/Paragraph'
import { List } from './editor/components/List'
import { Image } from './editor/components/Image'
import { DateTime } from './editor/components/DateTime'
import { Link } from './editor/components/Link'
import { Leaf } from './editor/components/Leaf'

import { FormatToolbar } from './FormatToolbar'

import styles from './DocEditor.module.css'

const lodash = require('lodash')

export type BulletedListElement = {
  type: kSlateBlockTypeUnorderedList
  children: Descendant[]
}

export type CheckListItemElement = {
  type: kSlateBlockTypeListCheckItem
  checked: boolean
  children: Descendant[]
}

export const DocEditor = ({ className, nid, data, saveText }) => {
  const [value, setValue] = useState<Descendant[]>([])
  const [showJinn, setShowJinn] = useState<boolean>(false)
  useEffect(() => {
    let isSubscribed = true
    setValue(data.getText())
    return () => (isSubscribed = false)
  }, [nid])
  const renderElement = useCallback(
    (props) => <Element nid={nid} {...props} />,
    [nid]
  )
  const renderLeaf = useCallback((props) => <Leaf {...props} />, [nid])
  const editor = useMemo(
    () =>
      withJinn(
        setShowJinn,
        withTypography(
          withLinks(
            withDateTime(
              withImages(withShortcuts(withReact(withHistory(createEditor()))))
            )
          )
        )
      ),
    []
  )
  return (
    <div className={className}>
      <Jinn show={showJinn} setShow={setShowJinn} editor={editor} />
      <Slate
        editor={editor}
        value={value}
        onChange={(value) => {
          setValue(value)
          // Save the value to remote
          saveText(value)
        }}
      >
        <FormatToolbar />
        <Editable
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          spellCheck
          autoFocus
        />
      </Slate>
    </div>
  )
}

export const ReadOnlyDoc = ({ className, nid, data }) => {
  const [value, setValue] = useState<Descendant[]>([])
  useEffect(() => {
    let isSubscribed = true
    setValue(data.getText())
    return () => (isSubscribed = false)
  }, [nid])
  const renderElement = useCallback(
    (props) => <ReadOnlyElement nid={nid} {...props} />,
    [nid]
  )
  const renderLeaf = useCallback((props) => <Leaf {...props} />, [nid])
  const editor = useMemo(
    () =>
      withTypography(
        withLinks(withDateTime(withImages(withReact(createEditor()))))
      ),
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
          renderLeaf={renderLeaf}
          readOnly
        />
      </Slate>
    </div>
  )
}

const withImages = (editor) => {
  const { insertData, isVoid } = editor

  editor.isVoid = (element) => {
    return element.type === kSlateBlockTypeImage ? true : isVoid(element)
  }

  editor.insertData = (data) => {
    const text = data.getData('text/plain')
    const { files } = data

    if (files && files.length > 0) {
      for (const file of files) {
        const reader = new FileReader()
        const [mime] = file.type.split('/')

        if (mime === 'image') {
          reader.addEventListener('load', () => {
            const url = reader.result
            insertImage(editor, url)
          })

          reader.readAsDataURL(file)
        }
      }
    } else if (isImageUrl(text)) {
      insertImage(editor, text)
    } else {
      insertData(data)
    }
  }

  return editor
}

const insertImage = (editor, url) => {
  const text = { text: '' }
  const image: ImageElement = {
    type: kSlateBlockTypeImage,
    url,
    children: [text],
  }
  Transforms.insertNodes(editor, image)
}

const isImageUrl = (url) => {
  if (!url) return false
  if (!isUrl(url)) return false
  const ext = new URL(url).pathname.split('.').pop()
  return imageExtensions.includes(ext)
}

// Links

const tryParseDate = (text: Optional<string>) => {
  return null
}

const withDateTime = (editor) => {
  const { insertData, insertText, isInline, isVoid } = editor

  editor.isInline = (element) => {
    return element.type === kSlateBlockTypeDateTime ? true : isInline(element)
  }

  editor.isVoid = (element) => {
    return element.type === kSlateBlockTypeDateTime ? true : isVoid(element)
  }

  editor.insertText = (text) => {
    const date = tryParseDate(text)
    if (date) {
      wrapDateTime(editor, text, date)
    } else {
      insertText(text)
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

const insertDateTime = (editor, text) => {
  if (editor.selection) {
    const date = tryParseDate(text)
    if (date) {
      wrapDateTime(editor, text, date)
    }
  }
}

const isDateTimeActive = (editor) => {
  const [element] = Editor.nodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      n.type === kSlateBlockTypeDateTime,
  })
  return !!element
}

const unwrapDateTime = (editor) => {
  Transforms.unwrapNodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      n.type === kSlateBlockTypeDateTime,
  })
}

const wrapDateTime = (editor, text, date) => {
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
    Transforms.insertNodes(editor, element)
  } else {
    Transforms.wrapNodes(editor, element, { split: true })
    Transforms.collapse(editor, { edge: 'end' })
  }
}

const _makeElementRender = (isEditable: boolean) => {
  return React.forwardRef(({ attributes, children, element, nid }, ref) => {
    switch (element.type) {
      case kSlateBlockTypeUnorderedList:
        return (
          <List.Unordered ref={ref} {...attributes}>
            {children}
          </List.Unordered>
        )
      case kSlateBlockTypeOrderedList:
        return (
          <List.Ordered ref={ref} {...attributes}>
            {children}
          </List.Ordered>
        )
      case kSlateBlockTypeListItem:
        return (
          <List.Item ref={ref} {...attributes}>
            {children}
          </List.Item>
        )
      case kSlateBlockTypeListCheckItem:
        return (
          <List.CheckItem
            element={element}
            attributes={attributes}
            isEditable={isEditable}
            ref={ref}
          >
            {children}
          </List.CheckItem>
        )
      case kSlateBlockTypeH1:
        return (
          <Header1 ref={ref} nid={nid} {...attributes}>
            {children}
          </Header1>
        )
      case kSlateBlockTypeH2:
        return (
          <Header2 ref={ref} nid={nid} {...attributes}>
            {children}
          </Header2>
        )
      case kSlateBlockTypeH3:
        return (
          <Header3 ref={ref} nid={nid} {...attributes}>
            {children}
          </Header3>
        )
      case kSlateBlockTypeH4:
        return (
          <Header4 ref={ref} nid={nid} {...attributes}>
            {children}
          </Header4>
        )
      case kSlateBlockTypeH5:
        return (
          <Header5 ref={ref} nid={nid} {...attributes}>
            {children}
          </Header5>
        )
      case kSlateBlockTypeH6:
        return (
          <Header6 ref={ref} nid={nid} {...attributes}>
            {children}
          </Header6>
        )
      case kSlateBlockTypeCode:
        return (
          <CodeBlock ref={ref} {...attributes}>
            {children}
          </CodeBlock>
        )
      case kSlateBlockTypeBreak:
        return (
          <HRule attributes={attributes} element={element} ref={ref}>
            {children}
          </HRule>
        )
      case kSlateBlockTypeQuote:
        return (
          <BlockQuote ref={ref} {...attributes}>
            {children}
          </BlockQuote>
        )
      case kSlateBlockTypeParagraph:
        return (
          <Paragraph ref={ref} {...attributes}>
            {children}
          </Paragraph>
        )
      case kSlateBlockTypeImage:
        return (
          <Image attributes={attributes} element={element} ref={ref}>
            {children}
          </Image>
        )
      case kSlateBlockTypeDateTime:
        return (
          <DateTime attributes={attributes} element={element} ref={ref}>
            {children}
          </DateTime>
        )
      case kSlateBlockTypeLink:
        return (
          <Link attributes={attributes} element={element} ref={ref}>
            {children}
          </Link>
        )
      default:
        return (
          <span ref={ref} {...attributes}>
            {children}
          </span>
        )
    }
  })
}

const Element = _makeElementRender(true)
const ReadOnlyElement = _makeElementRender(false)

export default DocEditor
