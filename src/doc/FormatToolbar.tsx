import React from 'react'
import { ButtonGroup } from 'react-bootstrap'

import { Editor, Transforms, Element as SlateElement } from 'slate'
import { useSlate } from 'slate-react'

import { jcss } from './../util/jcss'
import styles from './FormatToolbar.module.css'

import {
  CustomEditor,
  CustomElement,
  CustomElementType,
  MarkType,
} from './custom-types'
import { MaterialIcon } from './../util/material-types'

type ReactiveButtonProps = {
  active: boolean
} & React.HTMLProps<HTMLButtonElement>

// Button that flips between two different visual styles depending on
// whether what it controls is considered 'active' or not
const ReactiveButton = ({
  active,
  children,
  ...props
}: React.PropsWithChildren<ReactiveButtonProps>) => {
  const className = jcss(
    'material-icons',
    styles.toolbar_button_inactive,
    active ? styles.toolbar_button_active : ''
  )
  return (
    <span {...props} className={className}>
      {children}
    </span>
  )
}

const MarkButton = ({ mark, icon }: { mark: MarkType; icon: MaterialIcon }) => {
  const editor = useSlate()
  return (
    <ReactiveButton
      active={isMarkActive(editor, mark)}
      onMouseDown={(event: React.MouseEvent) => {
        event.preventDefault()
        toggleMark(editor, mark)
      }}
    >
      {icon}
    </ReactiveButton>
  )
}

const isMarkActive = (editor: CustomEditor, mark: MarkType) => {
  const marks = Editor.marks(editor)
  return marks ? marks[mark] === true : false
}

const toggleMark = (editor: CustomEditor, mark: MarkType) => {
  const isActive = isMarkActive(editor, mark)

  if (isActive) {
    Editor.removeMark(editor, mark)
  } else {
    Editor.addMark(editor, mark, true)
  }
}

const BlockButton = ({
  format,
  icon,
}: {
  format: CustomElementType
  icon: MaterialIcon
}) => {
  const editor = useSlate()
  return (
    <ReactiveButton
      active={isBlockActive(editor, format)}
      onMouseDown={(event) => {
        event.preventDefault()
        toggleBlock(editor, format)
      }}
    >
      {icon}
    </ReactiveButton>
  )
}

const isBlockActive = (editor: CustomEditor, format: CustomElementType) => {
  const [match] = Editor.nodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
  })

  return !!match
}

const LIST_TYPES: CustomElementType[] = [
  'bulleted-list' /* , 'numbered-list' */,
]

const toggleBlock = (editor: CustomEditor, format: CustomElementType) => {
  const isActive = isBlockActive(editor, format)
  const isList = LIST_TYPES.includes(format)

  Transforms.unwrapNodes(editor, {
    match: (node) =>
      !Editor.isEditor(node) &&
      SlateElement.isElement(node) &&
      LIST_TYPES.includes(node.type),
    split: true,
  })
  const newProperties: Partial<SlateElement> = {
    type: isActive ? 'paragraph' : isList ? 'list-item' : format,
  }
  Transforms.setNodes(editor, newProperties)

  if (!isActive && isList) {
    const block: CustomElement = { type: format, children: [] }
    Transforms.wrapNodes(editor, block)
  }
}

export const FormatToolbar = () => {
  return (
    <ButtonGroup className={styles.toolbar}>
      <MarkButton mark="bold" icon="format_bold" />
      <MarkButton mark="italic" icon="format_italic" />
      <MarkButton mark="underline" icon="format_underlined" />
      <MarkButton mark="code" icon="code" />
      <BlockButton format="heading-one" icon="looks_one" />
      <BlockButton format="heading-two" icon="looks_two" />
      <BlockButton format="bulleted-list" icon="format_list_bulleted" />
      <BlockButton format="block-quote" icon="format_quote" />
    </ButtonGroup>
  )
}
