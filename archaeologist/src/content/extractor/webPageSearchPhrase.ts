import { extractPageContent } from './webPageContent'
import { log } from 'armoury'

export function extractSimilaritySearchPhraseFromPageContent(
  document_: Document,
  baseURL: string
): string | null {
  const pageContent = extractPageContent(document_, baseURL)
  const { title, textContentBlocks } = pageContent
  log.debug('Page content', pageContent)
  let author = pageContent.author.join(', ')
  if (!!author) {
    author = `By ${author}`
  }
  const lines = [
    title ?? '',
    author,
    ...textContentBlocks.map(({ text }) => text),
  ].filter((v) => !!v)
  return lines.join('\n')
}
