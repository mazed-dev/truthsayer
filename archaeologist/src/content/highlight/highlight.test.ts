// @ts-ignore: Do not remove this import, it's somewhat needed for jsdom
import type React from 'react' // eslint-disable-line @typescript-eslint/no-unused-vars

/**
 * @jest-environment jsdom
 */
import jsdom from 'jsdom'

const { JSDOM } = jsdom


type Slice = {
  start: number
  end?: number
}

type Highlight = {
  target: Node
  slice: Slice
}

/*
 * 1 |<--textContent-->|
 *   |<-highlight->|
 *
 * 2 |<--textContent-->|
 *   |<---highlight--->|
 *
 * 3 |<--textContent-->|
 *     |<-highlight->|
 *
 * 4 |<--textContent-->|
 *       |<-highlight->|
 *
 * 5 |<--textContent-->|
 *   |<-----highlight----->|
 *
 * 6 |<--textContent-->|
 *           |<--highlight-->|
*/
const getHighlightSlice = (textContent: string, highlightPlaintext: string): Slice | null => {
  if (highlightPlaintext.length <= textContent.length) {
    const start = textContent.indexOf(highlightPlaintext)
    if (start >= 0) {
      // Hooray, full string discovered
      return { start, end: start + highlightPlaintext.length }
    } else {
      return null }
  }
  let start = 0 // Math.min(textContent.length, highlightPlaintext.length)
  let end = textContent.length
  //while (!textContent.endsWith(highlightPlaintext.slice(0, end)) && end >= 0) {
  while (!highlightPlaintext.startsWith(
    textContent.slice(start, end)) && start !== end) {
    start++
  }
  if (start === end) {
    return null}
  return { start, end }
}

function traverse(element: ChildNode, highlightPlaintext: string): Node[] {
  let elements: Node[] = []
  for (let i = 0; i < element.childNodes.length; ++i) {
    const child = element.childNodes[i]
    console.log('ChildNode', i, child.nodeType, child.textContent)
    if (child.nodeType === Node.TEXT_NODE) {
      elements.push(child)
      //console.log('- text', child.textContent, child.nodeValue)
      // const mark = document_.createElement('mark')
      // mark.textContent = child.textContent
      // element.replaceChild(child, mark)
    }
    elements.push(...traverse(child, highlightPlaintext))
  }
  return elements
}

test('_exctractPageText - main', () => {
  const dom = new JSDOM(`<!DOCTYPE html>
<html class="responsive">
<head>
  <title>Some title</title>
</head>
<body >
  <main id="content" class="social social-popover">
    <p>Hungary <a href="https://flower.bloom/a/QGI5OkXp" title="Embargo on Oil Imports"><meta content="rpm3">hardened its public stance</a> Wednesday, saying it would withdraw its threat to block an embargo only if its imports via pipelines are excluded.</p>
  </main>
</body>
</html>
`)
  const elements = dom.window.document.getElementsByTagName('p')
  const element = elements[0]
  const highlights = traverse(element, '')
  for (const el of highlights) {
    const mark = dom.window.document.createElement('mark')
    mark.textContent = el.textContent
    el.parentNode?.replaceChild(mark, el)
  }
  expect(dom.window.document.body.innerHTML).toStrictEqual('First')
})

test('getHighlightSlice', () => {
  expect(getHighlightSlice("", "")).toStrictEqual({start: 0, end: 0})
  expect(getHighlightSlice("abc", "abc")).toStrictEqual({start: 0, end: 3})
  expect(getHighlightSlice("-abc", "abc")).toStrictEqual({start: 1, end: 4})
  expect(getHighlightSlice("--abc", "abc")).toStrictEqual({start: 2, end: 5})
  expect(getHighlightSlice("--abc--", "abc")).toStrictEqual({start: 2, end: 5})
  expect(getHighlightSlice("--abc", "abc--")).toStrictEqual({start: 2, end: 5})
})
