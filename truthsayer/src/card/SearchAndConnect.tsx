import React from 'react'
import { Modal, Form } from 'react-bootstrap'

import { SearchGrid, NodeAttrsSearchItem } from '../grid/SearchGrid'

import lodash from 'lodash'

type SearchAndConnectJinnModalProps = {
  nid: string
  setShow: (show: boolean) => void
  addRef: ({ from, to }: { from: string; to: string }) => void
  left: boolean
}

type SearchAndConnectJinnModalState = {
  input: string
  q: string
  cards: any[]
}

class SearchAndConnectJinnModal extends React.Component<
  SearchAndConnectJinnModalProps,
  SearchAndConnectJinnModalState
> {
  inputRef: React.RefObject<HTMLInputElement>

  constructor(props: SearchAndConnectJinnModalProps) {
    super(props)
    this.state = {
      input: '',
      q: '',
      cards: [],
    }
    this.inputRef = React.createRef()
  }

  componentDidMount() {
    this.inputRef.current?.focus()
  }

  handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target
    this.startSmartSearch.cancel() // Do we need it?
    this.setState(
      {
        input: value,
      },
      () => {
        this.startSmartSearch(value)
      }
    )
  }

  startSmartSearch = lodash.debounce((value: string) => {
    this.setState({ cards: [], q: value })
  }, 800)

  addCards = (cards: any[]) => {
    this.setState((state) => {
      return {
        cards: lodash.concat(state.cards, cards),
      }
    })
  }

  onNodeCardClick = (node: NodeAttrsSearchItem) => {
    const { nid, left, addRef, setShow } = this.props
    const other_nid = node.nid
    if (left) {
      addRef({ from: other_nid, to: nid })
    } else {
      addRef({ from: nid, to: other_nid })
    }
    setShow(false)
  }

  render() {
    const { q, input, cards } = this.state
    return (
      <div
        //   className={styles.autocomplete_modal}
        className="test"
      >
        <Form.Control
          aria-label="Search-to-link"
          aria-describedby="basic-addon1"
          onChange={this.handleChange}
          value={input}
          placeholder="Type something"
          ref={this.inputRef}
        />
        <SearchGrid
          q={q}
          defaultSearch
          onCardClick={this.onNodeCardClick}
          portable
        >
          {cards}
        </SearchGrid>
      </div>
    )
  }
}

export const SearchAndConnectJinn = ({
  show,
  setShow,
  nid,
  addRef,
  left,
}: {
  show: boolean
  setShow: (show: boolean) => void
  nid: string
  addRef: ({ from, to }: { from: string; to: string }) => void
  left: boolean
}) => {
  return (
    <Modal
      show={show}
      onHide={() => setShow(false)}
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
      <SearchAndConnectJinnModal
        nid={nid}
        setShow={setShow}
        addRef={addRef}
        left={left}
      />
    </Modal>
  )
}
