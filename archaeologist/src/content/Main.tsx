import React from 'react'
import ReactDOM from 'react-dom'

import { TNode } from 'smuggler-api'

import { QuoteHighlight } from './highlight/highlight'

export const Main = ({ quotes }: { quotes: TNode[] }) => {
  // TODO(akindyakov): Use `scrollIntoView` to scroll to a certain quote using
  // the fact that each quote has id="<nid>".
  // document.getElementById('<nid>').scrollIntoView()
  const stickers = quotes.map((node: TNode) => {
    const { nid, extattrs } = node
    const web_quote = extattrs?.web_quote
    if (web_quote == null) {
      return null
    }
    const { path, text } = web_quote
    if (!node.isWebQuote() || path == null) {
      return null
    }
    const target = document.querySelector(path.join(' > '))
    if (target == null) {
      return null
    }
    return (
      <QuoteHighlight
        key={nid}
        nid={nid}
        target={target}
        highlightPlaintext={text}
      />
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
