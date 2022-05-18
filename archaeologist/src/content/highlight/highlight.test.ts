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

type HighlightSlicer = (textContent: string, highlightPlaintext: string) => Slice

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
const getHighlightBeginingSlice: HighlightSlicer = (textContent, highlightPlaintext) {
  if (highlightPlaintext.length <= textContent.length) {
    const ind = textContent.indexOf(highlightPlaintext)
    if (ind >= 0) {
      // Hooray, full string discovered
      return { start: ind, end: ind + highlightPlaintext.length }
    }
  }
  let end = Math.min(textContent.length, highlightPlaintext.length)
  while (!textContent.endsWith(highlightPlaintext.slice(0, end)) && end >= 0) {
    --end
  }
  return { start: textContent.length - end, end }
}

const getHighlightSlice: HighlightSlicer = (textContent, highlightPlaintext) {
  return { start: 0, end: 0}
}

function traverse(element: ChildNode, highlightPlaintext: string): Node[] {
  let elements: Node[] = []
  for (let i = 0; i < element.childNodes.length; ++i) {
    const child = element.childNodes[i]
    console.log('ChildNode', i, child.nodeType, child.textContent)
    if (child.nodeType === Node.TEXT_NODE) {
      elements.push(child)
      console.log('- text', child.textContent, child.nodeValue)
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
  const highlights = traverse(element, dom.window.document)
  for (const el of highlights) {
    const mark = dom.window.document.createElement('mark')
    mark.textContent = el.textContent
    el.parentNode?.replaceChild(mark, el)
  }
  expect(dom.window.document.body.innerHTML).toStrictEqual('First')
})
