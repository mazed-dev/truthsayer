import { serialize } from 'remark-slate'
import unified from 'unified'
import markdown from 'remark-parse'
import slate from 'remark-slate'
import { Descendant } from 'slate'

/**
 * Slate object to Markdown:
 * serialize slate state to a markdown string
 */
export function slateToMarkdown(state: Descendant[]): string {
  return state.map((v) => serialize(v)).join('')
}

/**
 * Markdown to Slate object:
 */
export async function markdownToSlate(text): Promise<Descendant[]> {
  const { contents } = await unified().use(markdown).use(slate).process(text)
  return contents
}
