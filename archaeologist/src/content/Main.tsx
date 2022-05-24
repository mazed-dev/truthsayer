import React from 'react'
import ReactDOM from 'react-dom'

import { TNode } from 'smuggler-api'

import {
  discoverHighlightsInElement,
  HighlightAtom,
} from './highlight/highlight'

export const Main = ({ quotes }: { quotes: TNode[] }) => {
  // TODO(akindyakov): Use `scrollIntoView` to scroll to a certain quote using
  // the fact that each quote has id="<nid>".
  // document.getElementById('<nid>').scrollIntoView()
  const stickers: JSX.Element[] = []
  quotes.forEach((node: TNode) => {
      const { nid, extattrs } = node
      const web_quote = extattrs?.web_quote
      if (web_quote == null) {
        return
      }
      const { path, text } = web_quote
      if (!node.isWebQuote() || path == null) {
        return
      }
      const target = document.querySelector(path.join(' > '))
      if (target == null) {
        return
      }
      discoverHighlightsInElement(target, text).forEach(
        ({ target, slice }, index) => {
          const key = `${nid}_${index}`
          stickers.push(<HighlightAtom key={key} target={target} slice={slice} />)
        }
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
