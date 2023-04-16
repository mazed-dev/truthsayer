import { exctractPageContent } from './webPageContent'

export function extractSimilaritySearchPhraseFromPageContent(
  document_: Document,
  baseURL: string
): string | null {
  const pageContent = exctractPageContent(document_, baseURL)
  let author = pageContent.author.join(', ')
  if (!!author) {
    author = `By ${author}`
  }
  const phrase = [
    pageContent.title,
    pageContent.description,
    author,
    pageContent.text,
  ]
    .filter((v) => !!v)
    .join('\n')
  return phrase
}
