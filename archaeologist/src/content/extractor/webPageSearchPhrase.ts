import { exctractPageContent } from './webPageContent'

export function extractSimilaritySearchPhraseFromPageContent(
  document_: Document,
  baseURL: string
): string | null {
  const pageContent = exctractPageContent(document_, baseURL)
  const phrase = [
    pageContent.title,
    pageContent.description,
    ...pageContent.author,
    pageContent.text,
  ]
    .filter((v) => !!v)
    .join('\n')
  return phrase
}
