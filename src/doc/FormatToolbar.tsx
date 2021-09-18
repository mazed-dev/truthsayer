import React from 'react'
import { ButtonGroup } from 'react-bootstrap'

import { Editor } from 'slate'
import { useSlate } from 'slate-react'

import { jcss } from './../util/jcss'
import styles from './FormatToolbar.module.css'

import { CustomEditor, MarkType } from './custom-types'
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

export const FormatToolbar = () => {
  return (
    <ButtonGroup className={styles.toolbar}>
      <MarkButton mark="bold" icon="format_bold" />
      <MarkButton mark="italic" icon="format_italic" />
      <MarkButton mark="code" icon="code" />
    </ButtonGroup>
  )
}
