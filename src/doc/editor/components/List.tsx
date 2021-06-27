import React from 'react'

import { ReactEditor, Slate, useReadOnly, useSlateStatic } from 'slate-react'
import { Element as SlateElement, Transforms } from 'slate'

import { jcss } from '../../../util/jcss'
import { CheckBox } from '../../../lib/CheckBox'

import styles from './List.module.css'
import './components.css'

import { debug } from '../../../util/log'

const lodash = require('lodash')

const ListItem = React.forwardRef(
  ({ className, children, ...attributes }, ref) => {
    className = jcss('doc_block_list_item', className)
    return (
      <li className={className} ref={ref} {...attributes}>
        {children}
      </li>
    )
  }
)

const OrderedList = React.forwardRef(
  ({ className, children, ...attributes }, ref) => {
    className = jcss('doc_block_ordered_list', className)
    return (
      <ol ref={ref} className={className} {...attributes}>
        {children}
      </ol>
    )
  }
)

const UnorderedList = React.forwardRef(
  ({ className, children, ...attributes }, ref) => {
    className = jcss('doc_block_unordered_list', className)
    return (
      <ul ref={ref} className={className} {...attributes}>
        {children}
      </ul>
    )
  }
)

const CheckListItem = React.forwardRef(
  ({ attributes, children, element, isEditable }, ref) => {
    const { checked = false } = element
    const editor = useSlateStatic()
    const readOnly = useReadOnly()
    const checkLineStyle = checked
      ? styles.check_line_span_checked
      : styles.check_line_span
    return (
      <div {...attributes} className={styles.check_item_span}>
        <span contentEditable={false} className={styles.check_box_span}>
          <CheckBox
            checked={checked}
            ref={ref}
            onChange={(event) => {
              const path = ReactEditor.findPath(editor, element)
              const newProperties: Partial<SlateElement> = {
                checked: !checked,
              }
              Transforms.setNodes(editor, newProperties, { at: path })
            }}
            disabled={!isEditable}
          />
        </span>
        <span
          contentEditable={!readOnly}
          suppressContentEditableWarning
          className={checkLineStyle}
        >
          {children}
        </span>
      </div>
    )
  }
)

export const List = {
  Ordered: OrderedList,
  Unordered: UnorderedList,
  Item: ListItem,
  CheckItem: CheckListItem,
}
