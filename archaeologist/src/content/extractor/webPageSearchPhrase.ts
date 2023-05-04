import { extractPageContent } from './webPageContent'
import { log, ensureSentenceEndPunctuation } from 'armoury'

export function extractSimilaritySearchPhraseFromPageContent(
  document_: Document,
  baseURL: string
): string | null {
  const pageContent = extractPageContent(document_, baseURL)
  log.debug('Page content', pageContent)
  let author = pageContent.author.join(', ')
  if (!!author) {
    author = `By ${author}`
  }
  const phrase = [pageContent.title, author, pageContent.text]
    .map((v) => {
      if (v) {
        return ensureSentenceEndPunctuation(v, '.')
      }
      return ''
    })
    .join('\n')
  return phrase
}
