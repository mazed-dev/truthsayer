import { unified } from 'unified'
import markdown from 'remark-parse'
import { remarkToSlate } from 'remark-slate-transformer'
import stringify from 'remark-stringify'
import { slateToRemark } from 'remark-slate-transformer'

import {
  TDoc,
  kSlateBlockTypeBreak,
  kSlateBlockTypeCode,
  kSlateBlockTypeDateTime,
  kSlateBlockTypeDeleteMark,
  kSlateBlockTypeEmphasisMark,
  kSlateBlockTypeH1,
  kSlateBlockTypeH2,
  kSlateBlockTypeH3,
  kSlateBlockTypeH4,
  kSlateBlockTypeH5,
  kSlateBlockTypeH6,
  kSlateBlockTypeInlineCodeMark,
  kSlateBlockTypeLink,
  kSlateBlockTypeImage,
  kSlateBlockTypeListItem,
  kSlateBlockTypeListCheckItem,
  kSlateBlockTypeOrderedList,
  kSlateBlockTypeParagraph,
  kSlateBlockTypeQuote,
  kSlateBlockTypeStrongMark,
  kSlateBlockTypeUnorderedList,
  CustomElementType,
  CustomTextType,
  Descendant,
} from 'elementary'

function depthToHeadingType(
  depth: number
):
  | typeof kSlateBlockTypeH1
  | typeof kSlateBlockTypeH2
  | typeof kSlateBlockTypeH3
  | typeof kSlateBlockTypeH4
  | typeof kSlateBlockTypeH5
  | typeof kSlateBlockTypeH6 {
  switch (depth) {
    case 1:
      return kSlateBlockTypeH1
    case 2:
      return kSlateBlockTypeH2
    case 3:
      return kSlateBlockTypeH3
    case 4:
      return kSlateBlockTypeH4
    case 5:
      return kSlateBlockTypeH5
    case 6:
      return kSlateBlockTypeH6
    default:
      return kSlateBlockTypeH6
  }
}

export function markdownToSlate(text: string): Descendant[] {
  const r2s = unified()
    .use(markdown)
    .use(remarkToSlate, {
      overrides: {
        text: (node) => ({
          text: node.value,
        }),
        inlineCode: (node) => ({
          text: node.value,
          code: true,
        }),
        heading: (node, next) => ({
          type: depthToHeadingType(node.depth),
          children: next(node.children),
        }),
        blockquote: (node, next) => ({
          type: kSlateBlockTypeQuote,
          children: next(node.children),
        }),
        paragraph: (node, next) => ({
          type: kSlateBlockTypeParagraph,
          children: next(node.children),
        }),
        thematicBreak: () => ({
          type: kSlateBlockTypeBreak,
          children: [],
        }),
        list: (node, next) => ({
          type: node.ordered
            ? kSlateBlockTypeOrderedList
            : kSlateBlockTypeUnorderedList,
          children: next(node.children),
        }),
        listItem: (node, next) => {
          if (node.checked != null) {
            return {
              type: kSlateBlockTypeListCheckItem,
              checked: node.checked,
              children: next(node.children),
            }
          }
          return {
            type: kSlateBlockTypeListItem,
            children: next(node.children),
          }
        },
        code: (node) => ({
          type: kSlateBlockTypeCode,
          children: [{ text: node.value }],
          lang: node.lang,
          meta: node.meta,
        }),
        link: (node, next) => ({
          type: kSlateBlockTypeLink,
          url: node.url,
          title: node.title || undefined,
          children: next(node.children),
        }),
        image: (node) => ({
          type: kSlateBlockTypeImage,
          url: node.url,
          title: node.title || undefined,
          alt: node.alt || undefined,
          children: [{ text: '' }],
        }),
      },
    })
  const value = r2s.processSync(text).result
  return value as Descendant[]
}

// export function slateToMarkdown(children: Descendant[]): string {
//   const processor = unified().use(slateToRemark).use(stringify)
//   const ast = processor.runSync({
//     type: 'root',
//     children,
//   })
//   const text = processor.stringify(ast)
//   console.log(text)
//   return text
// }
