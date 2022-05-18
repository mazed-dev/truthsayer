import React from 'react'
import ReactDOM from 'react-dom'

import { TNode } from 'smuggler-api'

import { QuoteSocket } from './QuoteSocket'
import { QuoteSticker } from './QuoteSticker'

export const Main = ({ quotes }: { quotes: TNode[] }) => {
  // TODO(akindyakov): Use `scrollIntoView` to scroll to a certain quote using
  // the fact that each quote has id="<nid>".
  // document.getElementById('<nid>').scrollIntoView()
  const stickers = quotes.map((node: TNode) => {
    const { nid, extattrs } = node
    const path = extattrs?.web_quote?.path
    if (!node.isWebQuote() || path == null) {
      return null
    }
    const target = document.querySelector(path.join(' > '))
    if (target == null) {
      return null
    }
    return (
      <QuoteSocket key={nid} target={target}>
        <QuoteSticker nid={nid} />
      </QuoteSocket>
    )
  }).filter(item => !!item)
  return <div>{stickers}</div>
}

export function renderPageAugmentation(
  socket: HTMLDivElement,
  quotes: TNode[]
) {
  ReactDOM.render(<Main quotes={quotes} />, socket)
}
