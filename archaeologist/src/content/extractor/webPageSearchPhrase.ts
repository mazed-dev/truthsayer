import { extractPageContent } from './webPageContent'
import { TextContentBlock } from 'smuggler-api'
import { log } from 'armoury'

export function extractSimilaritySearchPhraseFromPageContent(
  document_: Document,
  baseURL: string
): TextContentBlock[] | null {
  const pageContent = extractPageContent(document_, baseURL)
  log.debug('Page content', pageContent)
  let author = pageContent.author.join(', ')
  if (!!author) {
    author = `By ${author}`
  }
  const { title, textContentBlocks } = pageContent
  textContentBlocks.unshift({ text: author, type: 'P' })
  if (title) {
    textContentBlocks.unshift({ text: title, type: 'H', level: 1 })
  }
  return textContentBlocks.length > 0 ? textContentBlocks : null
}
