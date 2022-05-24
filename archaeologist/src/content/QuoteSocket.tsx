import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'

import { QuoteSticker } from './QuoteSticker'
import {
  discoverHighlightsInElement,
  renderInElementHighlight,
  ElementHighlight,
} from './highlight/highlight'

/**
 * Invisible custom element to prepend children to a given target element
 *
 * TODO(akindyakov) rename element
 */
export const QuoteSocket = ({
  nid,
  path,
  plaintext,
}: {
  nid: string
  path: string
  plaintext: string
}) => {
  const target = document.querySelector(path)
  if (target == null) {
    return null
  }
  const element = document.createElement('mazed-quotation')
  useEffect(() => {
    const highlights = discoverHighlightsInElement(target, plaintext)
    const reverts = highlights.map((highlight: ElementHighlight) =>
      renderInElementHighlight(highlight, document)
    )
    target.prepend(element)
    return () => {
      target.removeChild(element)
      reverts.forEach((callback) => callback())
    }
  })
  return ReactDOM.createPortal(<QuoteSticker nid={nid} />, element)
}
