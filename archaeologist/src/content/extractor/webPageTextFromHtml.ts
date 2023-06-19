/**
 * These are set of functions to read text from page HTML
 *
 * Main entry point is a function: extractTextContentBlocksFromHtml
 */

import DOMPurify from 'dompurify'
import { sortOutSpacesAroundPunctuation } from 'armoury'
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
  } else if (element instanceof HTMLElement) {
    return _extractPlainTextFromSanitizedContentHtml(element as HTMLElement)
  }
  const contentBlocks: TextContentBlock[] = []
  if (element.textContent != null) {
    for (const line of element.textContent.split('\n')) {
      const text = line.trim()
      if (text) {
        contentBlocks.push({ type: 'P', text })
      }
    }
  }
  return contentBlocks
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

function getExtraPrefix(element: HTMLElement): string | null {
  if (kNodeNamesOfTableCellToEnforceSpacing.has(element.nodeName)) {
    return ' | '
  }
  return null
}

function getExtraSuffix(element: HTMLElement): string | null {
  if (kNodeNamesToEnforcePunctuation.has(element.nodeName)) {
    return ' |\n'
  }
  return null
}

function _extractPlainTextFromSanitizedContentHtml(
  element: HTMLElement
): TextContentBlock[] {
  const blocks: TextContentBlock[] = []
  const last = iterateHTMLElementChildren(element, null, blocks)
  last.text = sortOutSpacesAroundPunctuation(last.text.trim())
  if (last.text.length > 1) {
    blocks.push(last)
  }
  return blocks
}

function iterateHTMLElementChildren(
  element: HTMLElement,
  current: TextContentBlock | null,
  blocks: TextContentBlock[]
): TextContentBlock {
  const blockType = getChunkTypeFromNode(element)
  if (blockType != null) {
    if (current != null) {
      current.text = sortOutSpacesAroundPunctuation(current.text.trim())
      if (current.text.length > 1) {
        blocks.push(current)
      }
      current = { type: blockType, text: '' }
    }
  }
  if (current == null) {
    current = { type: 'P', text: '' }
  }
  const prefix = getExtraPrefix(element)
  if (prefix != null) {
    current.text += prefix
  }
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const textContent = node.textContent
      if (textContent) {
        current.text += textContent
      }
    }
    if (node instanceof HTMLElement) {
      // Recursively iterate over the child element's children
      current = iterateHTMLElementChildren(node, current, blocks)
    }
  }
  const suffix = getExtraSuffix(element)
  if (suffix != null) {
    current.text += suffix
  }
  return current
}
