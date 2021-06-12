import React from 'react'

import { Card } from 'react-bootstrap'

import axios from 'axios'

import { smugler } from './../smugler/api'

import { SmallCard } from './../card/SmallCard'

export class NextRefSmartItem extends React.Component {
  constructor(props) {
    super(props)
    this.addNodeRefCancelToken = axios.CancelToken.source()
  }

  componentWillUnmount() {
    this.addNodeRefCancelToken.cancel()
  }

  handleSumbit = () => {
    this.createNextNode(this.props.title)
  }

  createNextNode = (title) => {
    const text = title ? `# ${title}` : ''
    smugler.node
      .create({
        text,
        cancelToken: this.addNodeRefCancelToken.token,
        from_nid: this.props.from_nid,
        to_nid: this.props.to_nid,
      })
      .then((node) => {
        if (node) {
          const nid = node.nid
          const replacement = `[${this.props.title}](${nid})`
          this.props.on_insert({
            replacement,
            // nid: nid,
          })
        }
      })
  }

  render() {
    return (
      <SmallCard onClick={this.handleSumbit}>
        <Card.Header>{this.props.label}</Card.Header>
        <Card.Body>
          <q>{this.props.title}</q>
        </Card.Body>
      </SmallCard>
    )
  }
}

NextRefSmartItem.defaultProps = {
  from_nid: null,
  to_nid: null,
}

export function nextRefSmartItemSearch(input, nid, on_insert) {
  const ret = []
  const next = input.match(/^(next|new) ?(.*)/i)
  if (next) {
    const title = next[2] ? next[2].trim() : 'New'
    ret.push(
      <NextRefSmartItem
        label={'Create new note and link'}
        title={title}
        from_nid={nid}
        on_insert={on_insert}
        ref={React.createRef()}
        key={'smart/next/new'}
      />
    )
  }

  const prev = input.match(/^(previ?o?u?s?|prior?)( .*)?/i)
  if (prev) {
    const title = prev[2] ? prev[2].trim() : 'New'
    ret.push(
      <NextRefSmartItem
        label={'Create new note and link as previous'}
        title={title}
        to_nid={nid}
        on_insert={on_insert}
        ref={React.createRef()}
        key={'smart/prev/new'}
      />
    )
  }
  return ret
}

export default NextRefSmartItem
