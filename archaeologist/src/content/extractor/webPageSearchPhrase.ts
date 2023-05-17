import { extractPageContent } from './webPageContent'
import { TextContentBlock } from 'smuggler-api'
import { log } from 'armoury'

export function extractSimilaritySearchPhraseFromPageContent(
  document_: Document,
  baseURL: string
): TextContentBlock[] | null {
  const pageContent = extractPageContent(document_, baseURL)
  log.debug('Page content', pageContent)
  const { title, textContentBlocks } = pageContent
  let author = pageContent.author.join(', ')
  if (!!author) {
    author = `By ${author}`
  }
  const header = [title ?? '', author].filter((v) => !!v).join('. ')
  if (header.length > 2) {
    textContentBlocks.unshift({ text: header, type: 'H', level: 1 })
  }
  return textContentBlocks.length > 0 ? textContentBlocks : null
}
