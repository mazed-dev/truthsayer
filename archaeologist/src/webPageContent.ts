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

import * as _log from './util/log'

export interface WebPageContentImage {
  icon: string | null // favicon, URL
  og: string | null // URL
}

export interface WebPageContent {
  title: string | null
  description: string | null
  lang: string | null
  author: string[]
  publisher: string[]
  text: string[]
  tags: string[]
  image: WebPageContentImage
}

export function exctractPageContent(
  html: HTMLHtmlElement,
  baseURL: string
): WebPageContent {
  const head = html.getElementsByTagName('head')[0]
  const body = html.getElementsByTagName('body')[0]
  return {
    title: _exctractPageTitle(head),
    author: _exctractPageAuthor(head),
    publisher: _exctractPagePublisher(head),
    description: _exctractPageDescription(head),
    lang: _exctractPageLanguage(html),
    text: _exctractPageText(body),
    image: _exctractPageImage(head, baseURL),
    tags: _exctractPageTags(head),
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

export function _stripText(text: string): string {
  text = text.trim()
  text = text.replace(/[\u00B6\u2202\s]{2,}/g, ' ')
  return text
}

/**
 * To avoid extracting all visible text from web page we are looking for
 * the special signs in HTML to find page main content in following order:
 *   - Tag: `main`, `article`.
 *   - ARIA element role: `article`, `main`.
 *   - ? Element class: `content`, `main`
 */
export function _exctractPageText(body: HTMLBodyElement): string[] {
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
      ret.push(_stripText(textContent))
      addedElements.push(element)
    }
  }
  if (ret.length > 0) {
    return ret
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
      ret.push(_stripText(textContent))
      addedElements.push(element)
    }
  }
  return ret
}

/**
 * Extract pate title defined within <head>
 *
 * Possible options:
 * - <head><title>Page title</title></head>
 * - <meta name="twitter:title" content="Page title">
 * - <meta property="og:title" content="Page title">
 */
export function _exctractPageTitle(head: HTMLHeadElement): string | null {
  const headTitles = head.getElementsByTagName('title')
  if (headTitles.length > 0) {
    for (const element of headTitles) {
      const title = (element.innerText || element.textContent)?.trim()
      if (title) {
        return _stripText(title)
      }
    }
  }
  // Last resort
  for (const elementsGroup of [
    head.querySelectorAll('meta[property="og:title"]'),
    head.querySelectorAll('meta[property="twitter:title"]'),
  ]) {
    for (const element of elementsGroup) {
      const title = element.getAttribute('content')?.trim()
      if (title) {
        return _stripText(title)
      }
    }
  }
  return null
}

export function _exctractPageAuthor(head: HTMLHeadElement): string[] {
  const authors: string[] = []
  for (const elementsGroup of [
    head.querySelectorAll('meta[property="author"]'),
  ]) {
    for (const element of elementsGroup) {
      const title = element.getAttribute('content')?.trim()
      if (title) {
        authors.push(_stripText(title))
      }
    }
  }
  return authors
}

export function _exctractPageDescription(head: HTMLHeadElement): string | null {
  for (const elementsGroup of [
    head.querySelectorAll('meta[name="description"]'),
    head.querySelectorAll('meta[property="og:description"]'),
    head.querySelectorAll('meta[name="twitter:description"]'),
  ]) {
    for (const element of elementsGroup) {
      const title = element.getAttribute('content')?.trim()
      if (title) {
        return _stripText(title)
      }
    }
  }
  return null
}

export function _exctractPageLanguage(html: HTMLHtmlElement): string | null {
  return html.lang || html.getAttribute('lang') || null
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
        publisher.push(_stripText(p))
      }
    }
    if (publisher.length > 0) {
      break
    }
  }
  return publisher
}

function ensureAbsRef(ref: string, baseURL: string): string {
  if (ref.startsWith('/')) {
    return `${baseURL}${ref}`
  }
  return ref
}

export function _exctractPageImage(
  head: HTMLHeadElement,
  baseURL: string
): WebPageContentImage {
  let icon = null
  let og = null
  for (const elementsGroup of [
    head.querySelectorAll('meta[property="og:image"]'),
    head.querySelectorAll('meta[name="twitter:image"]'),
  ]) {
    for (const element of elementsGroup) {
      const ref = element.getAttribute('content')?.trim()
      if (ref) {
        og = ensureAbsRef(ref, baseURL)
        break
      }
    }
    if (og !== null) {
      break
    }
  }
  for (const element of head.querySelectorAll('link[rel="icon"]')) {
    const ref = element.getAttribute('href')?.trim()
    if (ref) {
      icon = ensureAbsRef(ref, baseURL)
      break
    }
  }
  return { icon, og }
}

export function _exctractPageTags(head: HTMLHeadElement): string[] {
  // TODO
  return []
}
