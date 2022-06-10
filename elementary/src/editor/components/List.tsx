import React from 'react'
import { ReactEditor, useReadOnly, useSlateStatic } from 'slate-react'
import { Element as SlateElement, Transforms } from 'slate'

import { CheckListItemElement } from '../types.js'
import { CheckBox } from '../../CheckBox.js'

import {
  CheckItemBox,
  CheckBoxBox,
  CheckLineBox,
  CheckLineCheckedBox,
  OrderedListBox,
  UnorderedListBox,
  ListItemBox,
} from './components.js'

type ListItemProps = React.PropsWithChildren<{
  className: string
}>

const ListItem = React.forwardRef<HTMLLIElement, ListItemProps>(
  ({ className, children, ...attributes }, ref) => {
    return (
      <ListItemBox className={className} ref={ref} {...attributes}>
        {children}
      </ListItemBox>
    )
  }
)

type ListProps = React.PropsWithChildren<{
  className: string
}>

const OrderedList = React.forwardRef<HTMLOListElement, ListProps>(
  ({ className, children, ...attributes }, ref) => {
    return (
      <OrderedListBox ref={ref} className={className} {...attributes}>
        {children}
      </OrderedListBox>
    )
  }
)

const UnorderedList = React.forwardRef<HTMLUListElement, ListProps>(
  ({ className, children, ...attributes }, ref) => {
    return (
      <UnorderedListBox ref={ref} className={className} {...attributes}>
        {children}
      </UnorderedListBox>
    )
  }
)

type CheckListItemProps = React.PropsWithChildren<{
  isEditable: boolean
  attributes: any
  element: CheckListItemElement
}>

const CheckListItem = React.forwardRef<HTMLDivElement, CheckListItemProps>(
  ({ attributes, children, element, isEditable }, ref) => {
    const { checked = false } = element
    const editor = useSlateStatic()
    const readOnly = useReadOnly()
    const line = checked ? (
      <CheckLineCheckedBox
        contentEditable={!readOnly}
        suppressContentEditableWarning
      >
        {children}
      </CheckLineCheckedBox>
    ) : (
      <CheckLineBox contentEditable={!readOnly} suppressContentEditableWarning>
        {children}
      </CheckLineBox>
    )
    return (
      <CheckItemBox {...attributes}>
        <CheckBoxBox contentEditable={false}>
          <CheckBox
            checked={checked}
            ref={ref}
            onChange={(_event: React.MouseEvent) => {
              const path = ReactEditor.findPath(editor, element)
              const newProperties: Partial<SlateElement> = {
                checked: !checked,
              }
              Transforms.setNodes(editor, newProperties, { at: path })
            }}
            disabled={!isEditable}
          />
        </CheckBoxBox>
        {line}
      </CheckItemBox>
    )
  }
)

export const List = {
  Ordered: OrderedList,
  Unordered: UnorderedList,
  Item: ListItem,
  CheckItem: CheckListItem,
}
