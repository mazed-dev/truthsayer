/**
 * These are set of functions to read text from page HTML
 *
 * Main entry point is a function: extractTextContentBlocksFromHtml
 */

import DOMPurify from 'dompurify'
import { unicodeText, sortOutSpacesAroundPunctuation } from 'armoury'
import type { TextContentBlockType, TextContentBlock } from 'smuggler-api'

export type { TextContentBlockType, TextContentBlock }

/**
 * Bunch of hacks to extract plain text from HTML as paragraph's objects.
 */
export function extractTextContentBlocksFromHtml(
  html: string,
  textContent: string
): TextContentBlock[] {
  let clean = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
  })
  clean = clean
    .replace(/<\/t[dh]>/gi, ' |$&') // Insert separate between table cells
    .replace(/<t[dh]>/gi, ' $& ')
    .replace(/<\/t[hd]><\/tr>/gi, '\n$&')
    .replace(/<li>/gi, '$&- ')
  const doc = new DOMParser().parseFromString(clean, 'text/html')
  const contentBlocks = extractTextContentBlocksFromSanitizedHtmlElement(
    doc.body
  )
  if (contentBlocks.length > 0) {
    return contentBlocks
  } else {
    return [{ type: 'P', text: textContent }]
  }
}

export function extractTextContentBlocksFromSanitizedHtmlElement(
  element: Element | HTMLElement
): TextContentBlock[] {
  if (element instanceof HTMLElement && element.innerText != null) {
    // When we get access to innteText, we rely on document styles to split text
    // by paragraphs
    const contentBlocks: TextContentBlock[] = []
    for (const line of element.innerText.split('\n')) {
      const text = line.trim()
      if (text) {
        contentBlocks.push({ type: 'P', text })
      }
    }
    return contentBlocks
  } else {
    return _extractPlainTextFromSanitizedContentHtml(element)
  }
}

function getChunkTypeFromNode(node: Node): TextContentBlockType | null {
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null
  }
  const nodeName = node.nodeName
  const element = node as Element
  if (nodeName === 'TABLE' || nodeName === 'P' || nodeName === 'DL') {
    return 'P'
  }
  if (nodeName === 'LI') {
    return 'LI'
  }
  if (nodeName.match(/^H\d+$/)) {
    return 'H'
  }
  // To addres notion.so dodgy markup, #movefast
  const placeholder = element.attributes.getNamedItem('placeholder')
  if (placeholder !== null) {
    if (placeholder.value.toLowerCase().startsWith('heading')) {
      return 'H'
    }
    return 'P'
  }
  return null
}

const kNodeNamesOfTableCellToEnforceSpacing: Set<string> = new Set(['TD', 'TH'])
const kNodeNamesToEnforcePunctuation: Set<string> = new Set(['TR'])

function getExtraText(node: Node): string {
  if (kNodeNamesOfTableCellToEnforceSpacing.has(node.nodeName)) {
    return '| '
  }
  if (kNodeNamesToEnforcePunctuation.has(node.nodeName)) {
    return '|'
  }
  return ''
}

function _extractPlainTextFromSanitizedContentHtml(
  doc: HTMLElement
): TextContentBlock[] {
  const walker = doc.createTreeWalker(
    doc,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT | Node.ATTRIBUTE_NODE,
    {
      acceptNode(node: Node) {
        if (['BODY', 'HEAD', 'HTML'].includes(node.nodeName)) {
          return NodeFilter.FILTER_SKIP
        } else {
          return NodeFilter.FILTER_ACCEPT
        }
      },
    }
  )
  const contentBlocks: TextContentBlock[] = []
  let currentChunkText: string[] = []
  let currentChunkType: TextContentBlockType = 'P'
  while (walker.nextNode()) {
    const node = walker.currentNode
    const chunkType = getChunkTypeFromNode(node)
    if (chunkType != null) {
      const text = unicodeText.trimWhitespace(
        sortOutSpacesAroundPunctuation(currentChunkText.join('').trim())
      )
      if (text.length > 1) {
        contentBlocks.push({ type: currentChunkType, text })
      }
      currentChunkText = []
      currentChunkType = chunkType
    }
    currentChunkText.push(getExtraText(node))
    if (node.nodeType === Node.TEXT_NODE) {
      const textContent = node.textContent
      if (textContent) {
        currentChunkText.push(textContent)
      }
    }
  }
  const text = unicodeText.trimWhitespace(
    sortOutSpacesAroundPunctuation(currentChunkText.join('').trim())
  )
  if (text.length > 1) {
    contentBlocks.push({ type: currentChunkType, text })
  }
  return contentBlocks
}

function iterateHTMLElementChildren(element: HTMLElement) {
  const childNodes = element.childNodes;
  const length = childNodes.length;

  for (let i = 0; i < length; i++) {
    const childNode = childNodes[i];

    if (childNode instanceof HTMLElement) {
      // Process the child element
      console.log(childNode);

      // Recursively iterate over the child element's children
      iterateHTMLElementChildren(childNode);
    }
  }
}
