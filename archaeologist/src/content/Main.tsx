import React from 'react'
import ReactDOM from 'react-dom'

import { TNode } from 'smuggler-api'

import { QuoteSocket } from './QuoteSocket'

export const Main = ({ quotes }: { quotes: TNode[] }) => {
  // TODO(akindyakov): Use `scrollIntoView` to scroll to a certain quote using
  // the fact that each quote has id="<nid>".
  // document.getElementById('<nid>').scrollIntoView()
  const stickers = quotes
    .map((node: TNode) => {
      const { nid, extattrs } = node
      const web_quote = extattrs?.web_quote
      if (web_quote == null) {
        return null
      }
      const { path, text } = web_quote
      if (!node.isWebQuote() || path == null) {
        return null
      }
      return (
        <QuoteSocket
          nid={nid}
          key={nid}
          path={path.join(' > ')}
          plaintext={text}
        />
      )
    })
    .filter((item) => !!item)
  return <div>{stickers}</div>
}

export function renderPageAugmentation(
  socket: HTMLDivElement,
  quotes: TNode[]
) {
  ReactDOM.render(<Main quotes={quotes} />, socket)
}
