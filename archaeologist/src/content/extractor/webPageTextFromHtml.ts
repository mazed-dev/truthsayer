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
 * Bunch of hacks to make plaintext representation looks readable
 */
export function extractTextContentBlocksFromHtml(
  html: string,
  textContent: string
): TextContentBlock[] {
  // We don't trust MozillaReadability with plaintext extraction - it drops
  // spaces a lot in random places, text without spaces between words
  // affects similarity search quality. Instead we deal with dropping HTML
  // tags ourselves from HTML version of content from MozillaReadability.
  let clean = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
  })
  const doc = new DOMParser().parseFromString(clean, 'text/html')
  const contentBlocks = _extractPlainTextFromSanitizedContentHtml(doc)
  if (contentBlocks.length > 0) {
    return contentBlocks
  } else {
    return [{ type: 'P', text: textContent }]
  }
}

function getChunkTypeFromNode(node: Node): TextContentBlockType | null {
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null
  }
  const nodeName = node.nodeName
  const element = node as Element
  if (nodeName === 'TABLE' || nodeName === 'P' || nodeName === 'LI') {
    return 'P'
  }
  if (nodeName.match(/^H\d+$/)) {
    return 'H'
  }
  // Say hello to notion.so dodgy markup
  const placeholder = element.attributes.getNamedItem('placeholder')
  if (placeholder !== null) {
    if (placeholder.value.toLowerCase().startsWith('heading')) {
      return 'H'
    }
    return 'P'
  }
  return null
}

const kNodeNamesToEnforceSpacing: Set<string> = new Set(['TD', 'TH'])
const kNodeNamesToEnforcePunctuation: Set<string> = new Set(['TR'])

function getExtraText(node: Node): string {
  if (kNodeNamesToEnforceSpacing.has(node.nodeName)) {
    return '; '
  }
  if (kNodeNamesToEnforcePunctuation.has(node.nodeName)) {
    return '. '
  }
  return ''
}

function _extractPlainTextFromSanitizedContentHtml(
  doc: Document
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
