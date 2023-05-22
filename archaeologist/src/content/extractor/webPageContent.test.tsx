// @ts-ignore: Do not remove this import, it's somewhat needed for jsdom
import type React from 'react' // eslint-disable-line @typescript-eslint/no-unused-vars

/**
 * @jest-environment jsdom
 */
import jsdom from 'jsdom'

import {
  _cureTextContent,
  _cureTitle,
  _extractPageAuthor,
  _extractPageLanguage,
  _extractPagePublisher,
  extractPageTextCustom,
  _extractPageTitle,
  _extractYouTubeVideoObjectSchema,
  _extractPageAttributes,
  _extractPageThumbnailUrls,
  extractPageContent,
} from './webPageContent'

const { JSDOM } = jsdom

test('extractPageTextCustom - main', () => {
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
  const text = extractPageTextCustom(dom.window.document, '')
  expect(text).toStrictEqual([
    { text: 'First and second Third and forth', type: 'P' },
  ])
})

test('extractPageTextCustom - article', () => {
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
  const text = extractPageTextCustom(dom.window.document, '')
  expect(text).toStrictEqual([
    { text: 'First and second', type: 'P' },
    { text: 'Third and forth', type: 'P' },
  ])
})

test('extractPageTextCustom - <div role="main">', () => {
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
  const text = extractPageTextCustom(dom.window.document, '')
  expect(text).toStrictEqual([
    { text: 'First and second', type: 'P' },
    { text: 'Third and forth', type: 'P' },
  ])
})

test('extractPageTextCustom - nested elements', () => {
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
  const text = extractPageTextCustom(dom.window.document, '')
  expect(text).toStrictEqual([
    { text: 'First and second', type: 'P' },
    { text: 'Third and forth', type: 'P' },
  ])
})

test('_extractPageTitle - <title>', () => {
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
  const text = _extractPageTitle(dom.window.document)
  expect(text).toStrictEqual('Correct title')
})

test('_extractPageTitle - <meta property="og:title">', () => {
  const dom = new JSDOM(`<!DOCTYPE html>
<html>
<head>
<meta property="og:title" content="Correct title">
</head>
<body >
</body>
</html>
`)
  const text = _extractPageTitle(dom.window.document)
  expect(text).toStrictEqual('Correct title')
})

test('_extractPageAuthor', () => {
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
  const author = _extractPageAuthor(dom.window.document)
  expect(author).toStrictEqual(['Correct First Author'])
})

test('_extractPageLanguage', () => {
  const dom = new JSDOM(`<!DOCTYPE html>
<html lang="en">
<head>
</head>
<body >
</body>
</html>
`)
  const lang = _extractPageLanguage(dom.window.document)
  expect(lang).toStrictEqual('en')
})

test('_extractPagePublisher', () => {
  const dom = new JSDOM(`<!DOCTYPE html>
<html lang="en">
<head>
<meta property="og:site_name" content="The Publisher \n\n Abc">
</head>
<body >
</body>
</html>
`)
  const head = dom.window.document.getElementsByTagName('head')[0]
  const publisher = _extractPagePublisher(head)
  expect(publisher).toStrictEqual(['The Publisher Abc'])
})

test('extractPageContent - custom', async () => {
  const originalUrl = 'https://notion.so/test.html'
  const origin = 'https://notion.so'
  const dom = new JSDOM(
    `<!DOCTYPE html>
<html class="responsive" lang="en">
<head>
  <title>Some title</title>
  <meta property="author" content="Correct Author">
  <meta property="og:site_name" content="The Publisher">
  <meta name="twitter:description" content="A JavaScript implementation">
  <link rel="icon" class="js-site-favicon" type="image/svg+xml" href="https://example.com/favicons/favicon-dark.svg">
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

  const content = extractPageContent(dom.window.document, origin)
  expect(content.textContentBlocks).toStrictEqual([
    { type: 'P', text: 'First and second Third and forth' },
  ])
  expect(content.url).toStrictEqual(originalUrl)
  expect(content.title).toStrictEqual('Some title')
  expect(content.author).toStrictEqual(['Correct Author'])
  expect(content.publisher).toStrictEqual(['The Publisher'])
  expect(content.description).toStrictEqual('A JavaScript implementation')
  expect(content.lang).toStrictEqual('en')
  expect(content.previewImageUrls).toStrictEqual([
    'https://example.com/favicons/favicon-dark.svg',
    'https://notion.so/favicon.ico',
  ])
})

const kYoutubeBase = 'https://www.youtube.com'
const kYoutubeUrl = 'https://www.youtube.com/watch?v=AsDabC'
const kYoutubeDom = new JSDOM(
  `<!DOCTYPE html>
<html lang="en">
<head></head>
<body><div>
<ytd-player-microformat-renderer class="style-scope ytd-watch-flexy"><!--css-build:shady--><script type="application/ld+json" id="scriptTag" nonce="SRMkA" class="style-scope ytd-player-microformat-renderer">{"@context":"https://schema.org","@type":"VideoObject","description":"Lorem Ipsum is simply dummy text of the printing and typesetting industry.","duration":"PT6302S","embedUrl":"https://www.youtube.com/embed/WAIcDx8B1_0","interactionCount":"7","name":"Lorem Ipsum","thumbnailUrl":["https://i.ytimg.com/vi/WAIcDx8B1_0/hqdefault.jpg"],"uploadDate":"2021-04-12","genre":"Nonprofits & Activism","author":"Finibus Bonorum et Malorum"}</script></ytd-player-microformat-renderer>
</div></body></html>`,
  { url: kYoutubeUrl }
)
test('YouTube special extractor', () => {
  const videoObject = _extractYouTubeVideoObjectSchema(
    kYoutubeDom.window.document
  )
  expect(videoObject?.name).toStrictEqual('Lorem Ipsum')
  expect(videoObject?.description).toStrictEqual(
    'Lorem Ipsum is simply dummy text of the printing and typesetting industry.'
  )
  expect(videoObject?.author).toStrictEqual('Finibus Bonorum et Malorum')
  expect(videoObject?.thumbnailUrl).toStrictEqual([
    'https://i.ytimg.com/vi/WAIcDx8B1_0/hqdefault.jpg',
  ])
})

test('YouTube special extractor has a priority', () => {
  let { title, description, lang, author, publisher, thumbnailUrls } =
    _extractPageAttributes(kYoutubeDom.window.document, kYoutubeBase)
  expect(title).toStrictEqual('Lorem Ipsum')
  expect(description).toStrictEqual(
    'Lorem Ipsum is simply dummy text of the printing and typesetting industry.'
  )
  expect(author).toStrictEqual(['Finibus Bonorum et Malorum'])
  expect(lang).toStrictEqual('en')
  expect(publisher).toStrictEqual(['YouTube'])
  expect(thumbnailUrls).toStrictEqual([
    'https://i.ytimg.com/vi/WAIcDx8B1_0/hqdefault.jpg',
    `${kYoutubeBase}/favicon.ico`,
  ])
})

test('_extractPageThumbnailUrls', () => {
  const dom = new JSDOM(`<!DOCTYPE html>
<html lang="en">
<head>
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="shortcut icon" href="https://www.youtube.com/s/e69b/img/favicon.ico" type="image/x-icon">
<meta property="og:image" content="https://og.ytimg.com/vi/p3bdV/og.jpg">
<meta name="twitter:image" content="https://twitter.ytimg.com/vi/kKGRQ/twitter.jpg">
<meta name="vk:image" content="https://vk.ytimg.com/vi/ddd/vk.jpg">
<link rel="apple-touch-icon" href="/apple-touch-icon-1024.png">
<link rel="image_src" href="https://abc.abc/images/007/qOoFNK6Z7.png">
<link itemprop="thumbnailUrl" href="https://thumb.ytimg.com/vi/RQ/df.jpg">
</head>
<body >
</body>
</html>
`)
  const refs = _extractPageThumbnailUrls(
    dom.window.document,
    'https://base.ytimg.com'
  )
  // Order of elements does mater here, the best options come first.
  expect(refs).toStrictEqual([
    'https://og.ytimg.com/vi/p3bdV/og.jpg',
    'https://twitter.ytimg.com/vi/kKGRQ/twitter.jpg',
    'https://vk.ytimg.com/vi/ddd/vk.jpg',
    'https://abc.abc/images/007/qOoFNK6Z7.png',
    'https://thumb.ytimg.com/vi/RQ/df.jpg',
    'https://base.ytimg.com/apple-touch-icon-1024.png',
    'https://www.youtube.com/s/e69b/img/favicon.ico',
    'https://base.ytimg.com/favicon.ico',
  ])
})

test('_cureTitle', () => {
  expect(
    _cureTitle(
      '☕ Checkmate - x926453253@gmail.com - Gmail',
      'https://mail.google.com/mail/u/0/'
    )
  ).toStrictEqual('☕ Checkmate - x926453253@gmail.com')
})

test('_cureTextContent', () => {
  expect(
    _cureTextContent(
      [{ type: 'P', text: 'New Guinea, to Hainan.[2]' }],
      'https://en.example.com'
    )
  ).toStrictEqual([{ type: 'P', text: 'New Guinea, to Hainan.[2]' }])
  expect(
    _cureTextContent(
      [
        {
          type: 'P',
          text: 'the former Australian territory of New Guinea, to Hainan.[2] The sinking',
        },
      ],
      'https://en.wikipedia.org/wiki/Montevideo'
    )
  ).toStrictEqual([
    {
      type: 'P',
      text: 'the former Australian territory of New Guinea, to Hainan. The sinking',
    },
  ])
})
