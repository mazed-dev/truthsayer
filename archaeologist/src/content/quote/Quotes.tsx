import React from 'react'
import { NodeUtil } from 'smuggler-api'
import type { TNode } from 'smuggler-api'

import { QuoteHighlight } from './QuoteHighlight'

export const Quotes = ({ quotes }: { quotes: TNode[] }) => {
  const stickers = quotes.map((node: TNode) => {
    const { nid, extattrs } = node
    const web_quote = extattrs?.web_quote
    if (web_quote == null) {
      return null
    }
    const { path, text } = web_quote
    if (!NodeUtil.isWebQuote(node) || path == null) {
      return null
    }
    return (
      <QuoteHighlight
        key={nid}
        nid={nid}
        path={path}
        highlightPlaintext={text}
      />
    )
  })
  return <div>{stickers}</div>
}
