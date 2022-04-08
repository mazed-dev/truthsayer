import React from 'react'
import ReactDOM from 'react-dom'

import { TNode } from 'smuggler-api'

import { QuoteSocket } from './QuoteSocket'
import { QuoteSticker } from './QuoteSticker'

export const Main = ({ quotes }: { quotes: TNode[] }) => {
  // TODO(akindyakov): Use `scrollIntoView` to scroll to a certain quote if URL
  // hash is the nid of that quote:
  // document.getElementById('<nid>').scrollIntoView()
  const stickers = quotes.map((node: TNode) => {
    const { nid, extattrs } = node
    const path = extattrs?.web_quote?.path
    if (!node.isWebQuote() || path == null) {
      return null
    }
    return (
      <QuoteSocket key={nid} path={path.join(' > ')}>
        <QuoteSticker nid={nid} />
      </QuoteSocket>
    )
  })
  return <div>{stickers}</div>
}

export function renderPageAugmentation(
  socket: HTMLDivElement,
  quotes: TNode[]
) {
  ReactDOM.render(<Main quotes={quotes} />, socket)
}
