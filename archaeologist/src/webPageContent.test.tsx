import React from 'react'

/**
 * @jest-environment jsdom
 */
import jsdom from 'jsdom'

import {
  _stripText,
  _exctractPageText,
  _exctractPageTitle,
  _exctractPageAuthor,
  _exctractPageDescription,
  _exctractPageTags,
  _exctractPageLanguage,
  _exctractPagePublisher,
  _exctractPageImage,
} from './webPageContent'

const { JSDOM } = jsdom

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
  expect(text).toStrictEqual(['First and second Third and forth'])
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
  expect(text).toStrictEqual(['First and second Third and forth'])
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
  expect(text).toStrictEqual(['First and second Third and forth'])
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
  expect(text).toStrictEqual(['First and second Third and forth'])
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
  const html = dom.window.document.getElementsByTagName('html')[0]
  const lang = _exctractPageLanguage(html)
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
  const lang = _exctractPagePublisher(head)
  expect(lang).toStrictEqual(['The Publisher'])
})

test('_exctractPageImage', () => {
  const dom = new JSDOM(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta property="og:image" content="https://cdn.abc.com/ZgxW.jpg">
  <link rel="icon" type="image/png" href="https://cdn.abc.com/favicon-96x96.png" sizes="96x96">
</head>
<body>
</body>
</html>
`)
  const head = dom.window.document.getElementsByTagName('head')[0]
  const image = _exctractPageImage(head, 'https://zxc.abc')
  expect(image).toStrictEqual({
    icon: 'https://cdn.abc.com/favicon-96x96.png',
    og: 'https://cdn.abc.com/ZgxW.jpg',
  })
})

test('_exctractPageImage - relative ref', () => {
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
  const head = dom.window.document.getElementsByTagName('head')[0]
  const image = _exctractPageImage(head, 'https://term.info')
  expect(image).toStrictEqual({
    icon: 'https://term.info/favicon-96x96.png',
    og: 'https://term.info/asset/ZgxW.jpg',
  })
})
