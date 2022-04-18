import React, { useRef, useState } from 'react'
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
import { TNode } from 'smuggler-api'

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
  const [input, setInput] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [extCards, setExtCards] = useState<React.ReactNode[]>([])
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
  const startSmartSearch = lodash.debounce((value: string) => {
    setExtCards([])
    setSearchQuery(value)
    const item = dateTimeJinnSearch(value, insertElement)
    if (item != null) {
      setExtCards((cards) => cards.concat(item))
    }
  }, 900)
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target
    startSmartSearch.cancel() // Do we need it?
    setInput(value)
    startSmartSearch(value)
  }

  const handleSumbit = () => {}

  const onNodeCardClick = (node: TNode) => {
    const nid = node.getNid()
    const doc = TDoc.fromNodeTextData(node.getText())
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
        {extCards}
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
