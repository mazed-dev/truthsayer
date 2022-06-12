import { unified } from 'unified'
import markdown from 'remark-parse'
import { remarkToSlate } from 'remark-slate-transformer'
import stringify from 'remark-stringify'
import { slateToRemark } from 'remark-slate-transformer'
import type * as mdast from 'mdast'

import {
  kSlateBlockTypeBreak,
  kSlateBlockTypeCode,
  kSlateBlockTypeH1,
  kSlateBlockTypeH2,
  kSlateBlockTypeH3,
  kSlateBlockTypeH4,
  kSlateBlockTypeH5,
  kSlateBlockTypeH6,
  kSlateBlockTypeImage,
  kSlateBlockTypeLink,
  kSlateBlockTypeListCheckItem,
  kSlateBlockTypeListItem,
  kSlateBlockTypeOrderedList,
  kSlateBlockTypeParagraph,
  kSlateBlockTypeQuote,
  kSlateBlockTypeUnorderedList,
} from 'elementary'

import type {
  BlockQuoteElement,
  CheckListItemElement,
  CodeBlockElement,
  CustomElement,
  OrderedListElement,
  CustomText,
  Descendant,
  ImageElement,
  LinkElement,
  ParagraphElement,
  ThematicBreakElement,
  UnorderedListElement,
} from 'elementary'

import gfm from 'remark-gfm'

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

function headingTypeToDepth(
  type:
    | typeof kSlateBlockTypeH1
    | typeof kSlateBlockTypeH2
    | typeof kSlateBlockTypeH3
    | typeof kSlateBlockTypeH4
    | typeof kSlateBlockTypeH5
    | typeof kSlateBlockTypeH6
): number {
  switch (type) {
    case kSlateBlockTypeH1:
      return 1
    case kSlateBlockTypeH2:
      return 2
    case kSlateBlockTypeH3:
      return 3
    case kSlateBlockTypeH4:
      return 4
    case kSlateBlockTypeH5:
      return 5
    case kSlateBlockTypeH6:
      return 6
    default:
      return 6
  }
}

type NextForPhrasingContentFn = (child: mdast.PhrasingContent[]) => CustomText[]
function getTextFromPhrasingContent(
  children: mdast.PhrasingContent[],
  next: NextForPhrasingContentFn
): string {
  const ret: string[] = []
  for (const child of children) {
    for (const element of next([child])) {
      const { text } = element
      ret.push(text)
    }
  }
  return ret.join(' ')
}

function getTableCode(
  table: mdast.TableRow[],
  next: NextForPhrasingContentFn
): string {
  const rows: string[] = []
  for (const row of table) {
    const cells: string[] = []
    for (const cell of row.children) {
      cells.push(getTextFromPhrasingContent(cell.children, next))
    }
    rows.push(`| ${cells.join(' | ')} |`)
  }
  return rows.join('\n')
}

function getListItemChildren(
  children: (mdast.BlockContent | mdast.DefinitionContent)[],
  next: (children: any[]) => CustomText[]
): CustomText[] {
  const ret: CustomText[] = []
  for (const p of children) {
    if ('children' in p) {
      ret.push(...next(p.children))
    }
  }
  return ret
}

export function markdownToSlate(text: string): Descendant[] {
  const r2s = unified()
    .use(markdown)
    .use(gfm)
    .use(remarkToSlate, {
      overrides: {
        text: (node) => ({
          text: node.value,
        }),
        emphasis: (node, next) => ({
          italic: true,
          text: getTextFromPhrasingContent(
            node.children,
            next as NextForPhrasingContentFn
          ),
        }),
        strong: (node, next) => ({
          bold: true,
          text: getTextFromPhrasingContent(
            node.children,
            next as NextForPhrasingContentFn
          ),
        }),
        inlineCode: (node) => ({
          text: node.value,
          code: true,
        }),
        table: (node, next) => ({
          type: kSlateBlockTypeCode,
          lang: 'markdown',
          text: getTableCode(node.children, next as NextForPhrasingContentFn),
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
          return {
            type: kSlateBlockTypeListItem,
            checked: node.checked ?? undefined,
            children: getListItemChildren(node.children, next),
          }
        },
        code: (node) => ({
          type: kSlateBlockTypeCode,
          children: [{ text: node.value }],
          lang: node.lang,
          meta: node.meta || undefined,
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

export function slateToMarkdown(children: Descendant[]): string {
  const processor = unified()
    .use(slateToRemark, {
      overrides: {
        [kSlateBlockTypeH1]: (node, next) => ({
          type: 'heading',
          depth: 1,
          children: next((node as CustomElement).children),
        }),
        [kSlateBlockTypeH2]: (node, next) => ({
          type: 'heading',
          depth: 2,
          children: next((node as CustomElement).children),
        }),
        [kSlateBlockTypeH3]: (node, next) => ({
          type: 'heading',
          depth: 3,
          children: next((node as CustomElement).children),
        }),
        [kSlateBlockTypeH4]: (node, next) => ({
          type: 'heading',
          depth: 4,
          children: next((node as CustomElement).children),
        }),
        [kSlateBlockTypeH5]: (node, next) => ({
          type: 'heading',
          depth: 5,
          children: next((node as CustomElement).children),
        }),
        [kSlateBlockTypeH6]: (node, next) => ({
          type: 'heading',
          depth: 6,
          children: next((node as CustomElement).children),
        }),
        [kSlateBlockTypeUnorderedList]: (node, next) => {
          return {
            type: 'list',
            ordered: false,
            children: next((node as UnorderedListElement).children),
          }
        },
        [kSlateBlockTypeOrderedList]: (node, next) => ({
          type: 'list',
          ordered: true,
          children: next((node as OrderedListElement).children),
        }),
        [kSlateBlockTypeListItem]: (node, next) => {
          return {
            type: 'listItem',
            checked: (node as CheckListItemElement).checked,
            children: next((node as CheckListItemElement).children),
          }
        },
        [kSlateBlockTypeListCheckItem]: (node, next) => {
          return {
            type: 'listItem',
            ordered: true,
            checked: (node as CheckListItemElement).checked,
            children: next((node as CheckListItemElement).children),
          }
        },
        [kSlateBlockTypeBreak]: (node, next) => ({
          type: 'thematicBreak',
          children: next((node as ThematicBreakElement).children),
        }),
        [kSlateBlockTypeCode]: (node, next) => {
          const { children, lang, meta } = node as CodeBlockElement
          return {
            type: 'code',
            children: next(children),
            lang,
            meta,
          }
        },
        [kSlateBlockTypeParagraph]: (node, next) => ({
          type: 'paragraph',
          children: next((node as ParagraphElement).children),
        }),
        [kSlateBlockTypeQuote]: (node, next) => ({
          type: 'blockquote',
          children: next((node as BlockQuoteElement).children),
        }),
        [kSlateBlockTypeImage]: (node) => {
          const { url, title, alt } = node as ImageElement
          return { type: 'image', url, title, alt }
        },
        [kSlateBlockTypeLink]: (node, next) => ({
          type: 'link',
          children: next((node as LinkElement).children),
        }),
      },
    })
    .use(stringify)
  const ast = processor.runSync({
    type: 'root',
    // @ts-ignore
    children,
  })
  const text = processor.stringify(ast)
  return text
}
