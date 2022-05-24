// @ts-ignore: Do not remove this import, it's somewhat needed for jsdom
import type React from 'react' // eslint-disable-line @typescript-eslint/no-unused-vars

/**
 * @jest-environment jsdom
 */
import jsdom from 'jsdom'

import {
  renderInElementHighlight,
  Slice,
  getHighlightSlice,
  discoverHighlightsInElement,
} from './highlight'

const { JSDOM } = jsdom

const _document = window.document

afterEach(() => {
  Object.defineProperty(window, 'document', {
    writable: true,
    value: _document,
  })
})

test('_exctractPageText - main', () => {
  const dom = new JSDOM(`<!DOCTYPE html>
<html>
<body >
  <main>
    <p>Hungary <a href="https://flower.co" title="Embargo on Oil Imports"><meta content="rpm3">hardened its public stance</a> Wednesday, saying it would withdraw its threat to block an embargo only if its imports via pipelines are excluded.</p>
  </main>
</body>
</html>
`)
  const elements = dom.window.document.getElementsByTagName('p')
  const element = elements[0]
  const highlights = discoverHighlightsInElement(
    element,
    'Hungary Wednesday, saying it'
  )
  for (const { target, slice } of highlights) {
    const text = target.textContent
    const highlighted = text?.slice(slice.start, slice.end)
    if (highlighted) {
      const box = dom.window.document.createElement('mazed-highlight-box')
      const mark = dom.window.document.createElement('mazed-highlight')
      mark.textContent = highlighted
      const prefix = text?.slice(0, slice.start)
      const suffix = text?.slice(slice.end)
      if (prefix) {
        box.appendChild(dom.window.document.createTextNode(prefix))
      }
      box.appendChild(mark)
      if (suffix) {
        box.appendChild(dom.window.document.createTextNode(suffix))
      }
      target.parentNode?.replaceChild(box, target)
    }
  }
  expect(dom.window.document.body.innerHTML).toStrictEqual('First')
})

test('renderInElementHighlight', () => {
  const dom = new JSDOM(`<!DOCTYPE html>
<html>
<body>
  <main>
    <p>Lorem Ipsum is simply dummy text of the printing industry.</p>
  </main>
</body>
</html>
`)
  const document_ = dom.window.document
  const elements = document_.getElementsByTagName('p')
  const p = elements[0]
  const target = p.childNodes[0]
  const slice: Slice = { start: 22, end: 32 }
  const revertCallback = renderInElementHighlight({ target, slice }, document_)
  expect(p.outerHTML).toStrictEqual(
    '<p><mazed-highlight-box>Lorem Ipsum is simply <mazed-highlight>dummy text</mazed-highlight> of the printing industry.</mazed-highlight-box></p>'
  )
  revertCallback()
  expect(p.outerHTML).toStrictEqual(
    '<p>Lorem Ipsum is simply dummy text of the printing industry.</p>'
  )
})

test('getHighlightSlice', () => {
  expect(getHighlightSlice('', '')).toStrictEqual(null)
  expect(getHighlightSlice('abc', 'abc')).toStrictEqual({ start: 0, end: 3 })
  expect(getHighlightSlice('-abc', 'abc')).toStrictEqual({ start: 1, end: 4 })
  expect(getHighlightSlice('--abc', 'abc')).toStrictEqual({ start: 2, end: 5 })
  expect(getHighlightSlice('--abc--', 'abc')).toStrictEqual({
    start: 2,
    end: 5,
  })
  expect(getHighlightSlice('--abc', 'abc--')).toStrictEqual({
    start: 2,
    end: 5,
  })
  expect(getHighlightSlice('--abc', 'abc-qwertyuiop')).toStrictEqual({
    start: 2,
    end: 5,
  })
  expect(getHighlightSlice('', 'abc')).toStrictEqual(null)
  expect(getHighlightSlice('123', 'abc')).toStrictEqual(null)
})
