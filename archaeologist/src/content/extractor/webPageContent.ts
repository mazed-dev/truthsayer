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

import { Readability as MozillaReadability } from '@mozilla/readability'
import lodash from 'lodash'

import { MimeType, log, stabiliseUrlForOriginId, unicodeText } from 'armoury'

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
  text: string | null
  previewImageUrls: string[]
}

export function exctractPageUrl(document_: Document): string {
  return document_.URL || document_.documentURI
}

export function exctractReadableTextFromPage(document_: Document): string {
  const article = new MozillaReadability(
    document_.cloneNode(true) as Document,
    {
      keepClasses: false,
    }
  ).parse()
  return article?.textContent || _exctractPageText(document_)
}

/**
 * Extract web page content to save as a **bookmark**
 */
export function exctractPageContent(
  document_: Document,
  baseURL: string
): WebPageContent {
  const url = stabiliseUrlForOriginId(document_.URL || document_.documentURI)
  let { title, description, lang, author, publisher, thumbnailUrls } =
    _extractPageAttributes(document_, baseURL)
  let text: string | null = null
  // The parse() method of @mozilla/readability works by modifying the DOM. This
  // removes some elements in the web page. We avoid this by passing the clone
  // of the document object to the Readability constructor.
  const article = new MozillaReadability(
    document_.cloneNode(true) as Document,
    {
      keepClasses: false,
    }
  ).parse()
  if (article) {
    // Do a best effort with what @mozilla/readability gives us here
    const {
      title: articleTitle,
      textContent,
      excerpt,
      byline,
      siteName,
    } = article
    if (title == null && articleTitle) {
      // We don't trust MozillaReadability with title, it fails to extract title
      // on some web sites such as YouTube. So we get back to it only if our own
      // title extractor discovered no good title.
      title = articleTitle
    }
    text = unicodeText.trimWhitespace(textContent)
    if (description == null && excerpt) {
      // Same story for a description, we can't fully rely on MozillaReadability
      // with page description, but get back to it when our own description
      // extractor fails.
      if (textContent.indexOf(excerpt) < 0) {
        // MozillaReadability takes first paragraph as a description, if it
        // hasn't found description in the article's metadata. Such description
        // is quite bad, it's better without description at all then.
        description = excerpt
      }
    }
    if (author.length === 0 && byline) {
      author.push(unicodeText.trimWhitespace(byline))
    }
    if (siteName) {
      publisher.push(siteName)
    }
  }
  author = author.filter((value: string, index: number, self: string[]) => {
    return self.indexOf(value) === index
  })
  if (text == null) {
    // With page text we trust MozillaReadability way more, so only if it fails
    // to extract, we try to do it ourself. Because this is what
    // MozillaReadability library does on the first place.
    text = _exctractPageText(document_)
  }
  // Cut string by length 10KiB to avoid blowing up backend with huge JSON.
  // We cut the text here avoiding splitting words, by using kTruncateSeparatorSpace separator.
  // Later on we can and perhaps should reconsider this limit.
  text = lodash.truncate(text, {
    length: 10240,
    separator: unicodeText.kTruncateSeparatorSpace,
    omission: '',
  })
  return {
    url,
    title: title || null,
    author,
    publisher,
    description: description || null,
    lang: lang || null,
    text,
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

/**
 * To avoid extracting all visible text from web page we are looking for
 * the special signs in HTML to find page main content in following order:
 *   - Tag: `main`, `article`.
 *   - ARIA element role: `article`, `main`.
 *   - ? Element class: `content`, `main`
 */
export function _exctractPageText(document_: Document): string {
  const body = document_.body
  const ret: string[] = []
  const addedElements: Element[] = []
  for (const elementsGroup of [
    body.getElementsByTagName('article'),
    body.getElementsByTagName('main'),
  ]) {
    for (const element of elementsGroup) {
      const textContent = (element.innerText || element.textContent)?.trim()
      if (!textContent) {
        // Skip empty text content
        continue
      }
      // If any of found elements is a child to one of added - skip it,
      // because we already added text from it with parent textContent
      const isAdded = addedElements.find((addedEl) => {
        return isSameOrDescendant(addedEl, element)
      })
      if (isAdded) {
        continue
      }
      ret.push(unicodeText.trimWhitespace(textContent))
      addedElements.push(element)
    }
  }
  if (ret.length > 0) {
    return lodash.unescape(ret.join(' '))
  }
  for (const elementsGroup of [
    body.querySelectorAll('[role="main"]'),
    body.querySelectorAll('[role="article"]'),
    body.querySelectorAll('[role="presentation"]'),
    body.getElementsByClassName('post-header'),
    body.getElementsByClassName('post-content'),
  ]) {
    for (const element of elementsGroup) {
      const textContent = element.textContent?.trim()
      if (!textContent) {
        continue
      }
      const isAdded = addedElements.find((addedEl) => {
        return isSameOrDescendant(addedEl, element)
      })
      if (isAdded) {
        continue
      }
      ret.push(unicodeText.trimWhitespace(textContent))
      addedElements.push(element)
    }
  }
  return lodash.unescape(ret.join(' '))
}

/**
 * Extract pate title defined within <head>
 *
 * Possible options:
 * - <head><title>Page title</title></head>
 * - <meta name="twitter:title" content="Page title">
 * - <meta property="og:title" content="Page title">
 */
export function _exctractPageTitle(document_: Document): string | null {
  for (const [selector, attribute] of [
    ['head > title', 'innerText'],
    ['meta[property="dc:title"]', 'content'],
    ['meta[property="dcterm:title"]', 'content'],
    ['meta[property="og:title"]', 'content'],
    ['meta[property="title"]', 'content'],
    ['meta[name="twitter:title"]', 'content'],
  ]) {
    for (const element of document_.querySelectorAll(selector)) {
      const title = unicodeText.trimWhitespace(
        element.getAttribute(attribute)?.trim() || ''
      )
      if (title) {
        return lodash.unescape(title)
      }
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

export function _exctractPageAuthor(document_: Document): string[] {
  const authors: string[] = []
  for (const [selector, attribute] of [
    ['meta[property="author"]', 'content'],
  ]) {
    for (const element of document_.querySelectorAll(selector)) {
      const author = unicodeText.trimWhitespace(
        element.getAttribute(attribute)?.trim() || ''
      )
      if (author) {
        authors.push(lodash.unescape(author))
      }
    }
  }
  return authors
}

export function _exctractPageDescription(document_: Document): string | null {
  for (const [selector, attribute] of [
    ['meta[name="dc:description"]', 'content'],
    ['meta[name="dcterm:description"]', 'content'],
    ['meta[name="description"]', 'content'],
    ['meta[property="og:description"]', 'content'],
    ['meta[name="twitter:description"]', 'content'],
  ]) {
    for (const element of document_.querySelectorAll(selector)) {
      const text = unicodeText.trimWhitespace(
        element.getAttribute(attribute)?.trim() || ''
      )
      if (text) {
        return lodash.unescape(text)
      }
    }
  }
  return null
}

export function _exctractPageLanguage(document_: Document): string | null {
  for (const html of document_.getElementsByTagName('html')) {
    if (html) {
      return html.lang || html.getAttribute('lang') || null
    }
  }
  return null
}

export function _exctractPagePublisher(head: HTMLHeadElement): string[] {
  const publisher: string[] = []
  for (const elementsGroup of [
    head.querySelectorAll('meta[property="og:site_name"]'),
    head.querySelectorAll('meta[property="article:publisher"]'),
    head.querySelectorAll('meta[name="apple-mobile-web-app-title"]'),
  ]) {
    for (const element of elementsGroup) {
      const p = element.getAttribute('content')?.trim()
      if (p) {
        publisher.push(unicodeText.trimWhitespace(p))
      }
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

export function _exctractYouTubeVideoObjectSchema(
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
  const lang = _exctractPageLanguage(document_) || undefined
  let title: string | undefined
  let description: string | undefined
  const author: string[] = []
  const publisher: string[] = []
  const thumbnailUrls: string[] = []
  // Special extractors have a priority
  const youtubeUrlRe = new RegExp('https?://(www.)?youtube.com')
  if (youtubeUrlRe.test(baseURL)) {
    const youtube = _exctractYouTubeVideoObjectSchema(document_)
    if (youtube !== null) {
      title = youtube.name
      description = youtube.description
      author.push(youtube.author)
      thumbnailUrls.push(...youtube.thumbnailUrl)
      publisher.push('YouTube')
    }
  }
  if (title == null) {
    title = _exctractPageTitle(document_) || undefined
  }
  if (description == null) {
    description = _exctractPageDescription(document_) || undefined
  }
  if (author.length === 0) {
    author.push(..._exctractPageAuthor(document_))
  }
  thumbnailUrls.push(..._extractPageThumbnailUrls(document_, baseURL))
  return { lang, title, description, author, publisher, thumbnailUrls }
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
  for (const [selector, attribute] of [
    ['meta[property="og:image"]', 'content'],
    ['meta[name="twitter:image"]', 'content'],
    ['meta[name="vk:image"]', 'content'],
    ['link[rel="image_src"]', 'href'],
    ['link[itemprop="thumbnailUrl"]', 'href'],
    ['link[rel="apple-touch-icon"]', 'href'],
    ['link[rel="shortcut icon"]', 'href'],
    ['link[rel="icon"]', 'href'],
  ]) {
    for (const element of document_.querySelectorAll(selector)) {
      const ref = element.getAttribute(attribute)?.trim()
      if (ref) {
        const absRef = ensureAbsRef(ref, baseURL)
        refs.push(absRef)
      }
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
      log.debug('Mazed: preview image extraction failed with', err)
    }
  }
  return null
}
