import React from 'react'
import { ButtonGroup } from 'react-bootstrap'

import { Editor } from 'slate'
import { useSlate } from 'slate-react'

import { jcss } from './../util/jcss'
import styles from './FormatToolbar.module.css'

import { CustomEditor, MarkType } from './custom-types'
import { HoverTooltip } from '../lib/tooltip'

type ReactiveButtonProps = {
  className?: string
  active: boolean
} & React.HTMLProps<HTMLButtonElement>

// Button that flips between two different visual styles depending on
// whether what it controls is considered 'active' or not
const ReactiveButton = ({
  className,
  active,
  ...props
}: React.PropsWithChildren<ReactiveButtonProps>) => {
  className = jcss(
    active ? styles.custom_button_active : styles.custom_button,
    className
  )
  return <span {...props} className={className} />
}

const MarkButton = ({
  format,
  symbol,
}: {
  format: MarkType
  symbol: string
}) => {
  const editor = useSlate()
  return (
    <ReactiveButton
      active={isMarkActive(editor, format)}
      onMouseDown={(event: React.MouseEvent) => {
        event.preventDefault()
        toggleMark(editor, format)
      }}
    >
      <HoverTooltip tooltip={format}>{symbol}</HoverTooltip>
    </ReactiveButton>
  )
}

const isMarkActive = (editor: CustomEditor, format: MarkType) => {
  const marks = Editor.marks(editor)
  return marks ? marks[format] === true : false
}

const toggleMark = (editor: CustomEditor, format: MarkType) => {
  const isActive = isMarkActive(editor, format)

  if (isActive) {
    Editor.removeMark(editor, format)
  } else {
    Editor.addMark(editor, format, true)
  }
}

export const FormatToolbar = () => {
  return (
    <ButtonGroup className={styles.toolbar}>
      <MarkButton format="bold" symbol="B" />
      <MarkButton format="italic" symbol="I" />
      <MarkButton format="code" symbol="<>" />
    </ButtonGroup>
  )
}
