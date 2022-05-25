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

test('discoverHighlightsInElement - plain', () => {
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
  const highlightPlaintext = 'gary Wednesday, saying it'
  const highlights = discoverHighlightsInElement(element, highlightPlaintext)
  const text: string[] = []
  for (const { target, slice } of highlights) {
    const { textContent } = target
    if (textContent != null) {
      text.push(textContent.slice(slice.start, slice.end))
    }
  }
  expect(text.join('')).toStrictEqual(highlightPlaintext)
})

test('discoverHighlightsInElement - nested lists', () => {
  const dom = new JSDOM(`<!DOCTYPE html>
<html>
<body >
<main>
<ol>
  <li>Lists can be nested
    <ul><li>Four spaces
        <ul><li>Eight spaces
            <ul><li>Twelve spaces</li></ul></li></ul></li></ul></li>
  <li>And back</li>
</ol>
</main>
</body>
</html>
`)
  const highlightPlaintext = `Lists can be nested
    Four spaces
        Eight spaces
            Twelve spaces
  And back
`
  const elements = dom.window.document.getElementsByTagName('li')
  const element = elements[0]
  const highlights = discoverHighlightsInElement(element, highlightPlaintext)
  const text: string[] = []
  for (const { target, slice } of highlights) {
    const { textContent } = target
    if (textContent != null) {
      text.push(textContent.slice(slice.start, slice.end))
    }
  }
  expect(text.join('')).toStrictEqual(highlightPlaintext)
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
