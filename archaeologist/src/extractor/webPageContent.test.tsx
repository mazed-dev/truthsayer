// Do not remove this import
import React from 'react' // eslint-disable-line @typescript-eslint/no-unused-vars

/**
 * @jest-environment jsdom
 */
import jsdom from 'jsdom'

import fetchMock from 'jest-fetch-mock'

import { Mime } from 'smuggler-api'

import {
  _stripText,
  _exctractPageText,
  _exctractPageTitle,
  _exctractPageAuthor,
  _exctractPageLanguage,
  _exctractPagePublisher,
  _exctractPageImage,
  exctractPageContent,
} from './webPageContent'

global.fetch = fetchMock

const { JSDOM } = jsdom

beforeEach(() => {
  fetchMock.doMock()
})

test('_stripText', () => {
  expect(
    _stripText(`  a  b   c     d   \t \n  e\n\n
@ A B C D E F G H I J K L M N O P Q R S T U V W X Y Z [ \\ ] ^ _ \` a b
 c d e f g h i j k l m n o p q r s t u v w x y z { | } ~
  `)
  ).toStrictEqual(
    'a b c d e @ A B C D E F G H I J K L M N O P Q R S T U V W X Y Z [ \\ ] ^ ' +
      '_ ` a b c d e f g h i j k l m n o p q r s t u v w x y z { | } ~'
  )
})

test('_exctractPageText - main', () => {
  const dom = new JSDOM(`<!DOCTYPE html>
<html class="responsive">
<head>
  <title>Some title</title>
</head>
<body >
  <div>
    <div>
      <main id="content" class="social social-popover">
        <div id="1" class="eng export 1">First and second</div>
        <div id="2" class="eng export 2">Third and forth</div>
      </main>
    </div>
  </div>
</body>
</html>
`)
  const body = dom.window.document.getElementsByTagName('body')[0]
  const text = _exctractPageText(body)
  expect(text).toStrictEqual('First and second Third and forth')
})

test('_exctractPageText - article', () => {
  const dom = new JSDOM(`<!DOCTYPE html>
<html class="responsive">
<head>
  <title>Some title</title>
</head>
<body >
  <div>
    <article id="content" class="social social-popover" >
      <p id="1" class="eng export 1">First and second</p>
      <p id="2" class="eng export 2">Third and forth</p>
    </article>
  </div>
</body>
</html>
`)
  const body = dom.window.document.getElementsByTagName('body')[0]
  const text = _exctractPageText(body)
  expect(text).toStrictEqual('First and second Third and forth')
})

test('_exctractPageText - <div role="main">', () => {
  const dom = new JSDOM(`<!DOCTYPE html>
<html class="responsive">
<head>
  <title>Some title</title>
</head>
<body >
  <div>
    <div role="main">
      <p id="1" class="eng export 1">First and second</p>
      <p id="2" class="eng export 2">Third and forth</p>
    </div>
  </div>
</body>
</html>
`)
  const body = dom.window.document.getElementsByTagName('body')[0]
  const text = _exctractPageText(body)
  expect(text).toStrictEqual('First and second Third and forth')
})

test('_exctractPageText - nested elements', () => {
  const dom = new JSDOM(`<!DOCTYPE html>
<html class="responsive">
<head>
  <title>Some title</title>
</head>
<body >
  <div role="main">
    <div role="article">
      <p id="1" class="eng export 1">First and second</p>
      <p id="2" class="eng export 2">Third and forth</p>
    </div>
  </div>
</body>
</html>
`)
  const body = dom.window.document.getElementsByTagName('body')[0]
  const text = _exctractPageText(body)
  expect(text).toStrictEqual('First and second Third and forth')
})

test('_exctractPageTitle - <title>', () => {
  const dom = new JSDOM(`<!DOCTYPE html>
<html>
<head>
<title>Correct title</title>
</head>
<body >
  <title>Wrong title</title>
</body>
</html>
`)
  const head = dom.window.document.getElementsByTagName('head')[0]
  const text = _exctractPageTitle(head)
  expect(text).toStrictEqual('Correct title')
})

test('_exctractPageTitle - <meta property="og:title">', () => {
  const dom = new JSDOM(`<!DOCTYPE html>
<html>
<head>
<meta property="og:title" content="Correct title">
</head>
<body >
  <title>Wrong title</title>
</body>
</html>
`)
  const head = dom.window.document.getElementsByTagName('head')[0]
  const text = _exctractPageTitle(head)
  expect(text).toStrictEqual('Correct title')
})

test('_exctractPageAuthor', () => {
  const dom = new JSDOM(`<!DOCTYPE html>
<html>
<head>
<meta property="author" content="Correct First Author">
<meta property="author" content="Correct Second Author">
</head>
<body >
  <div property="author" content="Wrong Author" />
</body>
</html>
`)
  const head = dom.window.document.getElementsByTagName('head')[0]
  const author = _exctractPageAuthor(head)
  expect(author).toStrictEqual([
    'Correct First Author',
    'Correct Second Author',
  ])
})

test('_exctractPageLanguage', () => {
  const dom = new JSDOM(`<!DOCTYPE html>
<html lang="en">
<head>
</head>
<body >
</body>
</html>
`)
  const lang = _exctractPageLanguage(dom.window.document)
  expect(lang).toStrictEqual('en')
})

test('_exctractPagePublisher', () => {
  const dom = new JSDOM(`<!DOCTYPE html>
<html lang="en">
<head>
<meta property="og:site_name" content="The Publisher">
</head>
<body >
</body>
</html>
`)
  const head = dom.window.document.getElementsByTagName('head')[0]
  const publisher = _exctractPagePublisher(head)
  expect(publisher).toStrictEqual(['The Publisher'])
})

test('_exctractPageImage', async () => {
  const dom = new JSDOM(`<!DOCTYPE html>
<html lang="en">
<head>
  <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96">
</head>
<body>
</body>
</html>
`)
  fetchMock.mockResponse('...', {
    status: 200,
    headers: {
      'Content-type': Mime.IMAGE_PNG,
    },
    url: 'https://zxc.abc/favicon-96x96.png',
  })
  const head = dom.window.document.getElementsByTagName('head')[0]
  const image = await _exctractPageImage(head, 'https://zxc.abc')
  expect(image).toStrictEqual({
    content_type: Mime.IMAGE_PNG,
    data: 'data:image/png;base64,Li4u',
  })
})

test('_exctractPageImage - relative ref', async () => {
  const dom = new JSDOM(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta property="og:image" content="/asset/ZgxW.jpg">
  <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96">
</head>
<body>
</body>
</html>
`)
  fetchMock.mockResponse('...', {
    status: 200,
    headers: {
      'Content-type': Mime.IMAGE_JPEG,
    },
  })

  const head = dom.window.document.getElementsByTagName('head')[0]
  const image = await _exctractPageImage(head, 'https://term.info')
  expect(image).toStrictEqual({
    content_type: Mime.IMAGE_JPEG,
    data: 'data:image/jpeg;base64,Li4u',
  })
})

test('exctractPageContent - main', async () => {
  const originalUrl = 'https://example.org/test.html'
  const origin = 'https://example.org'
  const dom = new JSDOM(
    `<!DOCTYPE html>
<html class="responsive" lang="en">
<head>
  <title>Some title</title>
  <link rel="icon" href="/icon.svg" sizes="any" type="image/svg+xml">
  <meta property="author" content="Correct First Author">
  <meta property="author" content="Correct Second Author">
  <meta property="og:site_name" content="The Publisher">
  <meta name="twitter:description" content="A JavaScript implementation">
</head>
<body >
  <div>
    <div>
      <main id="content" class="social social-popover">
        <div id="1" class="eng export 1">First and second</div>
        <div id="2" class="eng export 2">Third and forth</div>
      </main>
    </div>
  </div>
</body>
</html>
`,
    { url: originalUrl }
  )

  fetchMock.mockResponse(
    '<?xml version="1.0" encoding="UTF-8" standalone="no"?><svg></svg>',
    {
      status: 200,
      headers: {
        'Content-type': Mime.IMAGE_SVG_XML,
      },
    }
  )

  const content = await exctractPageContent(dom.window.document, origin)
  const { url, title, author, publisher, description, lang, text, image } =
    content
  expect(text).toStrictEqual('First and second Third and forth')
  expect(url).toStrictEqual(originalUrl)
  expect(title).toStrictEqual('Some title')
  expect(author).toStrictEqual([
    'Correct First Author',
    'Correct Second Author',
  ])
  expect(publisher).toStrictEqual(['The Publisher'])
  expect(description).toStrictEqual('A JavaScript implementation')
  expect(lang).toStrictEqual('en')
  expect(image).toStrictEqual({
    content_type: Mime.IMAGE_SVG_XML,
    data: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+PHN2Zz48L3N2Zz4=',
  })
})
