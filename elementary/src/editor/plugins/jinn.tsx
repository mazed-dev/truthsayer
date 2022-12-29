import React, { useRef, useState, useEffect } from 'react'
import { Modal, Form } from 'react-bootstrap'
import styled from '@emotion/styled'
import {
  Editor,
  Element as SlateElement,
  Point,
  Range,
  Transforms,
} from 'slate'
import lodash from 'lodash'

import type { Optional } from 'armoury'
import type { TNode } from 'smuggler-api'

import { SearchGrid } from '../../grid/SearchGrid'
import { makeNodeLink, TDoc, CustomEditor } from '../types'
import { dateTimeJinnSearch } from './jinn-datetime'

const JinnInput = styled(Form.Control)`
  margin-bottom: 8px;
`

function JinnModal({
  editor,
  selection,
  onHide,
}: {
  editor: Editor
  selection: Range | null
  onHide: () => void
}) {
  if (selection == null) {
    return null
  }
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => inputRef?.current?.focus())
  const [input, setInput] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [extraCards, setExtraCards] = useState<React.ReactNode[]>([])
  const insertElement = (element: SlateElement) => {
    // Delete '//' first of all
    Transforms.delete(editor, {
      distance: 2,
      unit: 'character',
      reverse: true,
      at: selection,
    })
    const start = Range.start(selection)
    Transforms.insertNodes(editor, element, { at: start })
    onHide()
  }
  const doSmartSearch = (value: string) => {
    setExtraCards([])
    setSearchQuery(value)
    const item = dateTimeJinnSearch(value, insertElement)
    if (item != null) {
      setExtraCards((cards) => [item, ...cards])
    }
  }
  // Debounce in react functional component works only with useRef,
  // see https://stackoverflow.com/a/64856090
  const initiateSmartSearch = useRef(lodash.debounce(doSmartSearch, 800))
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target
    setInput(value)
    initiateSmartSearch.current(value)
  }

  const handleSumbit = () => {}

  const onNodeCardClick = (node: TNode) => {
    const nid = node.nid
    const doc = TDoc.fromNodeTextData(node.text)
    const title = doc.genTitle()
    const element = makeNodeLink(title, nid)
    insertElement(element)
  }

  return (
    <div>
      <JinnInput
        aria-label="Search-to-link"
        aria-describedby="basic-addon1"
        onChange={handleChange}
        onSubmit={handleSumbit}
        value={input}
        placeholder="Type something"
        ref={inputRef}
      />
      <SearchGrid
        q={searchQuery}
        defaultSearch
        onCardClick={onNodeCardClick}
        portable
      >
        {extraCards}
      </SearchGrid>
    </div>
  )
}

export const Jinn = ({
  isShown,
  onHide,
  editor,
}: {
  isShown: boolean
  onHide: () => void
  editor: CustomEditor
}) => {
  // Preserve editor selection to pass it to modal
  const { selection } = editor
  return (
    <Modal
      show={isShown}
      onHide={onHide}
      size="xl"
      aria-labelledby="contained-modal-title-vcenter"
      centered
      keyboard
      restoreFocus={false}
      animation={false}
      dialogClassName={''}
      scrollable
      enforceFocus
    >
      <JinnModal onHide={onHide} editor={editor} selection={selection} />
    </Modal>
  )
}

function movePoint(point: Point, num: number): Optional<Point> {
  const { path, offset } = point
  const newOffset = offset + num
  if (newOffset < 0) {
    return null
  }
  return {
    offset: newOffset,
    path,
  }
}

export const withJinn = (
  showJinn: () => void,
  editor: CustomEditor
): CustomEditor => {
  const { insertText } = editor

  editor.insertText = (text) => {
    const { selection } = editor
    if (text === '/' && selection && Range.isCollapsed(selection)) {
      const { anchor } = selection
      const start = movePoint(anchor, -1)
      if (start) {
        const range = { anchor, focus: start }
        const beforeText = Editor.string(editor, range)
        if (beforeText === '/') {
          showJinn()
        }
      }
    }
    insertText(text)
  }

  return editor
}
