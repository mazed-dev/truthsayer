import { exctractPageContent } from './webPageContent'
import { log, ensureSentenceEndPunctuation } from 'armoury'

export function extractSimilaritySearchPhraseFromPageContent(
  document_: Document,
  baseURL: string
): string | null {
  const pageContent = exctractPageContent(document_, baseURL)
  log.debug('Page content', pageContent)
  let author = pageContent.author.join(', ')
  if (!!author) {
    author = `By ${author}`
  }
  const text =
    (pageContent.description?.length ?? 0) > (pageContent.text?.length ?? 0)
      ? pageContent.description
      : pageContent.text
  const phrase = [pageContent.title, author, text]
    .map((v) => {
      if (v) {
        return ensureSentenceEndPunctuation(v, '.')
      }
      return ''
    })
    .join('\n')
  return phrase
}
