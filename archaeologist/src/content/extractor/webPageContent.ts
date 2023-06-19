/**
 * To avoid extracting all visible text from web page we are looking for
 * the special signs in HTML to find page main content in following order:
 *   - Tag: `main`, `article`.
 *   - Element class: `content`, `main`.
 *   - ARIA element role: `article`, `main`.
 *
 *  Extract page meta information:
 *   - head.title : innerText
 *   - head.meta[property="author"] : [content]
 *   - head.meta[name="description"] : [content]
 */

import { PreviewImageSmall } from 'smuggler-api'

import {
  Readability as MozillaReadability,
  isProbablyReaderable,
} from '@mozilla/readability'
import lodash from 'lodash'
import { MimeType, log, stabiliseUrlForOriginId, unicodeText } from 'armoury'
import {
  extractTextContentBlocksFromHtml,
  extractTextContentBlocksFromSanitizedHtmlElement,
  TextContentBlock,
} from './webPageTextFromHtml'

async function fetchImagePreviewAsBase64(
  url: string,
  document_: Document,
  dstSquareSize: number
): Promise<PreviewImageSmall> {
  // Load the image
  return new Promise((resolve, reject) => {
    const image = document_.createElement('img')
    if (process.env.CHROMIUM) {
      image.setAttribute('crossorigin', 'anonymous')
    }
    image.onerror = reject
    image.onload = (_ev) => {
      // Crop image, getting the biggest square from the center
      // and resize it down to [dstSquareSize] - we don't need more for preview
      const { width, height } = image
      const toCut = Math.floor((width - height) / 2)
      const srcDeltaX = toCut > 0 ? toCut : 0
      const srcDeltaY = toCut < 0 ? -toCut : 0
      const srcSquareSize = Math.min(width, height)
      const canvas = document_.createElement('canvas')
      canvas.width = dstSquareSize
      canvas.height = dstSquareSize
      const ctx = canvas.getContext('2d')
      if (ctx == null) {
        throw new Error("Can't make a canvas with the received image")
      }
      // Render white rectangle behind the image, just in case the image has
      // transparent background. Without it the background has a random colour,
      // black in my browser for instance. Default background colour depends on
      // multiple user settings in browser, so we can't rely on it.
      // https://stackoverflow.com/a/52672952
      ctx.fillStyle = '#FFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(
        image,
        srcDeltaX,
        srcDeltaY,
        srcSquareSize,
        srcSquareSize,
        0, // dstDeltaX
        0, // dstDeltaY
        dstSquareSize,
        dstSquareSize
      )
      const content_type = MimeType.IMAGE_JPEG
      const data = canvas.toDataURL(content_type)
      resolve({ data })
    }
    image.src = url
  })
}

export interface WebPageContentImage {
  data: string // Base64 encoded image
}

export interface WebPageContent {
  url: string
  title: string | null
  description: string | null
  lang: string | null
  author: string[]
  publisher: string[]
  previewImageUrls: string[]
  textContentBlocks: TextContentBlock[]
}

export function extractPageUrl(document_: Document): string {
  return document_.URL || document_.documentURI
}

export function extractReadableTextFromPage(
  document_: Document
): TextContentBlock[] {
  const url = stabiliseUrlForOriginId(document_.URL || document_.documentURI)
  const useCustomExtractors = shouldUseCustomExtractorsFor(url)
  const { textContentBlocks } = useCustomExtractors
    ? _extractPageContentCustom(document_, url, url)
    : _extractPageContentMozilla(document_, url)
  return textContentBlocks
}

/**
 * Extract web page content to save as a **bookmark**
 */
export function extractPageContent(
  document_: Document,
  baseURL: string
): WebPageContent {
  log.debug('extractPageContent', baseURL)
  const url = stabiliseUrlForOriginId(document_.URL || document_.documentURI)
  const useCustomExtractors = shouldUseCustomExtractorsFor(url)
  const {
    title,
    description,
    lang,
    author,
    publisher,
    thumbnailUrls,
    textContentBlocks,
  } = useCustomExtractors
    ? _extractPageContentCustom(document_, baseURL, url)
    : _extractPageContentMozilla(document_, baseURL)
  return {
    url,
    title: _cureTitle(title, url) ?? null,
    author,
    publisher,
    description: description || null,
    lang: lang || null,
    textContentBlocks: _cureTextContent(textContentBlocks, url),
    previewImageUrls: thumbnailUrls,
  }
}

const isSameOrDescendant = function (parent: Element, child: Element) {
  if (parent === child) {
    return true
  }
  let node = child.parentNode
  while (node) {
    if (node === parent) {
      return true
    }
    // Traverse up to the parent
    node = node.parentNode
  }
  // Go up until the root but couldn't find the `parent`
  return false
}

const kUrlMasksToUseCustomExtractorsFor: RegExp[] = [
  /https:\/\/(www.)?docs\.google\.com\/document\/d\//i,
  /https:\/\/(www.)?notion\.so\//i,
  /https:\/\/(www.)?youtube\.com\//i,
]
export function shouldUseCustomExtractorsFor(url: string): boolean {
  return !!kUrlMasksToUseCustomExtractorsFor.find((r: RegExp) => {
    return url.match(r)
  })
}

type DomSelector =
  | {
      type: 'className'
      className: string
      attr?: string
    }
  | {
      type: 'query'
      query: string
      attr?: string
    }
  | {
      type: 'tagName'
      tagName: string
      attr?: string
    }

function selectTextFromDomElement(
  selector: DomSelector,
  root: Document | HTMLHeadElement | HTMLElement
): { textContent: string; element: Element | HTMLElement } | null {
  let elementsGroup:
    | HTMLCollectionOf<HTMLElement | Element>
    | NodeListOf<Element>
  switch (selector.type) {
    case 'className':
      elementsGroup = root.getElementsByClassName(selector.className)
      break
    case 'query':
      elementsGroup = root.querySelectorAll(selector.query)
      break
    case 'tagName':
      elementsGroup = root.getElementsByTagName(selector.tagName)
  }
  const attr = selector.attr
  for (const element of elementsGroup) {
    let textContent: string | null
    if (attr) {
      textContent = element.getAttribute(attr)
    } else {
      textContent = element.textContent
    }
    if (textContent) {
      return { textContent, element }
    }
  }
  return null
}

/**
 * To avoid extracting all visible text from web page we are looking for
 * the special signs in HTML to find page main content in following order:
 *   - Tag: `main`, `article`.
 *   - ARIA element role: `article`, `main`.
 *   - ? Element class: `content`, `main`
 */
export function extractPageTextCustom(
  document_: Document,
  url: string
): TextContentBlock[] {
  if (url.match(/https:\/\/docs\.google\.com\/document\/d\//i)) {
    return _extractGoogleDocsText(document_)
  }
  return _extractPageTextCustomGeneric(document_, url)
}

export function _extractPageTextCustomGeneric(
  document_: Document,
  url: string
): TextContentBlock[] {
  const body = document_.body
  const blocks: TextContentBlock[] = []
  const addedElements: Element[] = []
  let selectors: DomSelector[] = [
    { type: 'tagName', tagName: 'article' },
    { type: 'tagName', tagName: 'main' },
  ]
  for (const selector of selectors) {
    const got = selectTextFromDomElement(selector, body)
    if (got == null) {
      continue
    }
    let { element } = got
    const textContentBlocks =
      extractTextContentBlocksFromSanitizedHtmlElement(element)
    // If any of found elements is a child to one of added - skip it,
    // because we already added text from it with parent textContent
    const isAdded = addedElements.find((addedEl) => {
      return isSameOrDescendant(addedEl, element)
    })
    if (isAdded) {
      continue
    }
    blocks.push(...textContentBlocks)
    addedElements.push(element)
  }
  if (blocks.length > 0) {
    return blocks
  }
  if (url.match(/https:\/\/notion\.so\//i)) {
    selectors = [
      { type: 'className', className: 'notion-frame' },
      { type: 'className', className: 'notion-peek-renderer' },
    ]
  } else {
    selectors = [
      { type: 'query', query: '[role="main"]' },
      { type: 'query', query: '[role="article"]' },
      { type: 'query', query: '[role="presentation"]' },
      { type: 'className', className: 'post-header' },
      { type: 'className', className: 'post-content' },
    ]
  }
  for (const selector of selectors) {
    const got = selectTextFromDomElement(selector, body)
    if (got == null) {
      continue
    }
    let { element } = got
    const textContentBlocks =
      extractTextContentBlocksFromSanitizedHtmlElement(element)
    const isAdded = addedElements.find((addedEl) => {
      return isSameOrDescendant(addedEl, element)
    })
    if (isAdded) {
      continue
    }
    blocks.push(...textContentBlocks)
    addedElements.push(element)
  }
  return blocks
}

/**
 * Extract pate title defined within <head>
 *
 * Possible options:
 * - <head><title>Page title</title></head>
 * - <meta name="twitter:title" content="Page title">
 * - <meta property="og:title" content="Page title">
 */
export function _extractPageTitle(document_: Document): string | null {
  let selectors: DomSelector[] = [
    { type: 'query', query: 'head > title' },
    { type: 'query', query: 'meta[property="dc:title"]', attr: 'content' },
    { type: 'query', query: 'meta[property="dcterm:title"]', attr: 'content' },
    { type: 'query', query: 'meta[property="og:title"]', attr: 'content' },
    { type: 'query', query: 'meta[property="title"]', attr: 'content' },
    { type: 'query', query: 'meta[name="twitter:title"]', attr: 'content' },
  ]
  // if (url.match(/https:\/\/notion\.so\//i)) {
  //   selectors.unshift({ type: 'query', query: 'div[placeholder="Untitled"]' })
  // }
  for (const selector of selectors) {
    const got = selectTextFromDomElement(selector, document_)
    if (got == null) {
      continue
    }
    const { textContent } = got
    const title = unicodeText.trimWhitespace(textContent)
    if (title) {
      return lodash.unescape(title)
    }
  }
  // Put document.title after meta information, because some sneaky web
  // developers like Twitter dev team put too much information into document
  // title doing Search Engine Optimisation. Today info from a page metadata is
  // more reliable because it's used for "preview" cards in social networks, so
  // web developers would less likely screw it up.
  const title = unicodeText.trimWhitespace(document_.title)
  if (title) {
    return title
  }
  return null
}

export function _extractPageAuthor(document_: Document): string[] {
  const selectors: DomSelector[] = [
    { type: 'query', query: 'meta[property="author"]', attr: 'content' },
  ]
  const authors: string[] = []
  for (const selector of selectors) {
    const got = selectTextFromDomElement(selector, document_)
    if (got == null) {
      continue
    }
    const { textContent } = got
    const author = unicodeText.trimWhitespace(textContent)
    if (author) {
      authors.push(lodash.unescape(author))
    }
  }
  return authors.filter((value: string, index: number, self: string[]) => {
    return self.indexOf(value) === index
  })
}

export function _extractPageDescription(document_: Document): string | null {
  const selectors: DomSelector[] = [
    { type: 'query', query: 'meta[name="dc:description"]', attr: 'content' },
    {
      type: 'query',
      query: 'meta[name="dcterm:description"]',
      attr: 'content',
    },
    { type: 'query', query: 'meta[name="description"]', attr: 'content' },
    {
      type: 'query',
      query: 'meta[property="og:description"]',
      attr: 'content',
    },
    {
      type: 'query',
      query: 'meta[name="twitter:description"]',
      attr: 'content',
    },
  ]
  for (const selector of selectors) {
    const got = selectTextFromDomElement(selector, document_)
    if (got == null) {
      continue
    }
    const { textContent } = got
    const text = unicodeText.trimWhitespace(textContent)
    if (text) {
      return lodash.unescape(text)
    }
  }
  return null
}

export function _extractPageLanguage(document_: Document): string | null {
  for (const html of document_.getElementsByTagName('html')) {
    if (html) {
      return html.lang || html.getAttribute('lang') || null
    }
  }
  return null
}

export function _extractPagePublisher(head: HTMLHeadElement): string[] {
  const publisher: string[] = []
  const selectors: DomSelector[] = [
    { type: 'query', query: 'meta[property="og:site_name"]', attr: 'content' },
    {
      type: 'query',
      query: 'meta[property="article:publisher"]',
      attr: 'content',
    },
    {
      type: 'query',
      query: 'meta[name="apple-mobile-web-app-title"]',
      attr: 'content',
    },
  ]
  for (const selector of selectors) {
    const got = selectTextFromDomElement(selector, head)
    if (got == null) {
      continue
    }
    const { textContent } = got
    const p = textContent.trim()
    if (p) {
      publisher.push(unicodeText.trimWhitespace(p))
    }
    if (publisher.length > 0) {
      break
    }
  }
  return publisher
}

export interface VideoObjectSchema {
  name: string
  description: string
  author: string
  thumbnailUrl: string[]
  duration: string
  uploadDate: string
  genre?: string
}

/**
 * Bunch of dirty hacks to make Title looks prettier and imporove similarity
 * search quality by removing clutter from specific type of titles.
 */
export function _cureTitle(
  title: string | undefined,
  url: string
): string | undefined {
  if (!title) {
    return title
  }
  if (url.match(/mail\.google\.com\/mail/)) {
    return title.replace(/[--] *Gmail$/i, '').trimEnd()
  }
  return title
}

/**
 * Post processing of the extracted text blocks from web page.
 *
 * That includes:
 * - Removing certain elements of the text on certain URLs.
 * - Limiting the size of the extracted text to avoid blowing up local storage
 *   and similiarity search.
 */
export function _cureTextContent(
  textContentBlocks: TextContentBlock[],
  url: string
): TextContentBlock[] {
  const blocks: TextContentBlock[] = []
  // Cut string by length 25KiB to avoid blowing up backend with huge JSON.
  // We cut the text here avoiding splitting words, by using kTruncateSeparatorSpace separator.
  // Later on we can and perhaps should reconsider this limit.
  let textSizeBytes = 0
  for (let { text, type } of textContentBlocks) {
    if (textSizeBytes > 25600) {
      break
    }
    if (url.search(/\.wikipedia\.org\//i) !== -1) {
      // For wikipedia pages - removing references [1] and [edit] buttons which
      // are omnipresent in an average wiki page.
      text = text.replace(/\[\d+\]/g, '').replace(/\[\s*edit\s*\]/g, '')
    }
    textSizeBytes += text.length
    blocks.push({ text, type })
  }
  return blocks
}

export function _extractYouTubeVideoObjectSchema(
  document_: Document
): VideoObjectSchema | null {
  let json: string | null = null
  for (const element of document_.querySelectorAll(
    'ytd-player-microformat-renderer > script.ytd-player-microformat-renderer'
  )) {
    if (element.getAttribute('type') === 'application/ld+json') {
      json = element.innerHTML
    }
  }
  if (json === null) {
    return null
  }
  const data = JSON.parse(json)
  return { ...data }
}

interface ExtractedPageAttributes {
  title?: string
  description?: string
  lang?: string
  author: string[]
  publisher: string[]
  thumbnailUrls: string[]
}
/**
 * Our own set of extractors to read page attributes
 */
export function _extractPageAttributes(
  document_: Document,
  baseURL: string
): ExtractedPageAttributes {
  const lang = _extractPageLanguage(document_) || undefined
  let title: string | undefined
  let description: string | undefined
  const author: string[] = []
  const publisher: string[] = []
  const thumbnailUrls: string[] = []
  // Special extractors have a priority
  const youtubeUrlRe = new RegExp('https?://(www.)?youtube.com')
  if (youtubeUrlRe.test(baseURL)) {
    const youtube = _extractYouTubeVideoObjectSchema(document_)
    if (youtube !== null) {
      title = youtube.name
      description = youtube.description
      author.push(youtube.author)
      thumbnailUrls.push(...youtube.thumbnailUrl)
      publisher.push('YouTube')
    }
  }
  if (title == null) {
    title = _extractPageTitle(document_) || undefined
  }
  if (description == null) {
    description = _extractPageDescription(document_) || undefined
  }
  if (author.length === 0) {
    author.push(..._extractPageAuthor(document_))
  }
  if (publisher.length === 0) {
    publisher.push(..._extractPagePublisher(document_.head))
  }
  thumbnailUrls.push(..._extractPageThumbnailUrls(document_, baseURL))
  return { lang, title, description, author, publisher, thumbnailUrls }
}

type GoogleDocModelChunk =
  | {
      ty: 'is'
      s?: string
      ibi: number
      sl: number
      sh: number
    }
  | {
      ty: 'as'
      si?: number
      sm: any
    }

/**
 * A simple hack to extact Google Doc text from Document meta information, it's
 * very fragile and will be broken with the next big release of Google Docs. But
 * for now to prove the point it should do the job.
 *
 * Test it on a real Google Document please, I couldn't come up with good enough
 * UT - script tags doesn't work with JSON in jest.
 */
export function _extractGoogleDocsText(
  document_: Document
): TextContentBlock[] {
  const blocks: TextContentBlock[] = []
  const elements = document_.getElementsByTagName('script')
  for (const el of elements) {
    if (!el.innerText) {
      continue
    }
    for (const line of el.innerText.split(';')) {
      if (line.startsWith('DOCS_modelChunk = ')) {
        try {
          const gchunks: GoogleDocModelChunk[] = JSON.parse(line.split('=')[1])
          for (const gch of gchunks) {
            if (gch.ty === 'is' && typeof gch.s === 'string' && gch) {
              const raw = gch.s
              for (const text of raw.split('\n')) {
                if (text) {
                  blocks.push({ text, type: 'P' })
                }
              }
            }
          }
        } catch (err) {
          log.error('Google Docs content parsing failed with error', err)
        }
      }
    }
  }
  return blocks
}

function ensureAbsRef(ref: string, baseURL: string): string {
  if (ref.startsWith('/')) {
    return `${baseURL}${ref}`
  }
  return ref
}

export function _extractPageThumbnailUrls(
  document_: Document,
  baseURL: string
): string[] {
  const refs: string[] = []
  // These are possible HTML DOM elements that might contain preview image.
  // - Open Graph image.
  // - Twitter preview image.
  // - VK preview image.
  // - Favicon, locations according to https://en.wikipedia.org/wiki/Favicon,
  //    with edge case for Apple specific web page icon.
  // - Thumbnail image
  //
  // Order of elements does mater here, the best options come first.
  const selectors: DomSelector[] = [
    { type: 'query', query: 'meta[property="og:image"]', attr: 'content' },
    { type: 'query', query: 'meta[name="twitter:image"]', attr: 'content' },
    { type: 'query', query: 'meta[name="vk:image"]', attr: 'content' },
    { type: 'query', query: 'link[rel="image_src"]', attr: 'href' },
    { type: 'query', query: 'link[itemprop="thumbnailUrl"]', attr: 'href' },
    { type: 'query', query: 'link[rel="apple-touch-icon"]', attr: 'href' },
    { type: 'query', query: 'link[rel="shortcut icon"]', attr: 'href' },
    { type: 'query', query: 'link[rel="icon"]', attr: 'href' },
  ]
  for (const selector of selectors) {
    const got = selectTextFromDomElement(selector, document_)
    if (got == null) {
      continue
    }
    const { textContent } = got
    const ref = textContent.trim()
    if (ref) {
      const absRef = ensureAbsRef(ref, baseURL)
      refs.push(absRef)
    }
  }
  refs.push(ensureAbsRef('/favicon.ico', baseURL))
  const seen: Set<string> = new Set()
  return refs.filter((ref: string) => {
    if (seen.has(ref)) {
      return false
    }
    seen.add(ref)
    return true
  })
}

export function _extractPageContentMozilla(
  document_: Document,
  baseURL: string
): ExtractedPageAttributes & { textContentBlocks: TextContentBlock[] } {
  // The parse() method of @mozilla/readability works by modifying the DOM. This
  // removes some elements in the web page. We avoid this by passing the clone
  // of the document object to the Readability constructor.
  const article = new MozillaReadability(
    document_.cloneNode(true) as Document,
    {
      keepClasses: false,
    }
  ).parse()
  if (!article) {
    return {
      author: [],
      publisher: [],
      thumbnailUrls: [],
      textContentBlocks: [],
    }
  }
  // Do a best effort with what @mozilla/readability gives us here
  let {
    title: articleTitle,
    textContent,
    excerpt,
    byline,
    siteName,
    content,
  } = article
  log.debug('Content', content)
  const textContentBlocks = extractTextContentBlocksFromHtml(
    content,
    textContent
  )
  let description: string | undefined = undefined
  if (textContent.indexOf(excerpt) < 0) {
    // '@mozilla/readability' takes first paragraph as a description, if it
    // hasn't found description in the article's metadata. Such description
    // is quite bad, it's better without description at all then.
    description = excerpt
  }
  const lang = _extractPageLanguage(document_) || undefined
  const thumbnailUrls = _extractPageThumbnailUrls(document_, baseURL)
  return {
    title: articleTitle,
    description,
    lang,
    author: !!byline ? [unicodeText.trimWhitespace(byline)] : [],
    publisher: [siteName],
    thumbnailUrls,
    textContentBlocks,
  }
}

export function _extractPageContentCustom(
  document_: Document,
  baseURL: string,
  url: string
): ExtractedPageAttributes & { textContentBlocks: TextContentBlock[] } {
  const { title, description, lang, author, publisher, thumbnailUrls } =
    _extractPageAttributes(document_, baseURL)
  const textContentBlocks = extractPageTextCustom(document_, url)
  return {
    title,
    description,
    lang,
    author,
    publisher,
    thumbnailUrls,
    textContentBlocks,
  }
}
/**
 * Try to fetch images for given urls. First successfully retrieved image is
 * returned, so sort urls by priority beforehands placing best options for a
 * preview image at the front of the `thumbnailUrls` array.
 */
export async function fetchAnyPagePreviewImage(
  document_: Document,
  thumbnailUrls: string[]
): Promise<WebPageContentImage | null> {
  for (const url of thumbnailUrls) {
    try {
      const icon = await fetchImagePreviewAsBase64(url, document_, 240)
      return icon
    } catch (err) {
      log.debug('Preview image extraction failed with', err)
    }
  }
  return null
}

export function isPageTextWorthReading(
  document_: Document,
  url: string
): boolean {
  if (shouldUseCustomExtractorsFor(url)) {
    return true
  } else {
    // Minimal length of content in characters. Experimental value, selected
    // based on results for very small pages. Feel free to adjust if needed.
    const minContentLength = 300
    return isProbablyReaderable(document_, { minContentLength })
  }
}
