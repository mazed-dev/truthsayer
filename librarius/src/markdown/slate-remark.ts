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

type BuildElementsFromPhrasingContentFn = (
  child: mdast.PhrasingContent[]
) => CustomText[]
function getTextFromPhrasingContent(
  children: mdast.PhrasingContent[],
  buildElements: BuildElementsFromPhrasingContentFn
): string {
  const ret: string[] = []
  for (const child of children) {
    for (const element of buildElements([child])) {
      const { text } = element
      ret.push(text)
    }
  }
  return ret.join(' ')
}

function getTableCode(
  table: mdast.TableRow[],
  buildElements: BuildElementsFromPhrasingContentFn
): string {
  const rows: string[] = []
  for (const row of table) {
    const cells: string[] = []
    for (const cell of row.children) {
      cells.push(getTextFromPhrasingContent(cell.children, buildElements))
    }
    rows.push(`| ${cells.join(' | ')} |`)
  }
  return rows.join('\n')
}

function getListItemChildren(
  children: (mdast.BlockContent | mdast.DefinitionContent)[],
  buildElements: (children: any[]) => CustomText[]
): CustomText[] {
  const ret: CustomText[] = []
  for (const p of children) {
    if ('children' in p) {
      ret.push(...buildElements(p.children))
    }
  }
  return ret
}

function ensureChildren(
  children: (CustomElement | CustomText)[]
): (CustomElement | CustomText)[] {
  if (children.length === 0) {
    return [{ text: '' }]
  }
  return children
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
        emphasis: (node, buildElements) => ({
          italic: true,
          text: getTextFromPhrasingContent(
            node.children,
            buildElements as BuildElementsFromPhrasingContentFn
          ),
        }),
        strong: (node, buildElements) => ({
          bold: true,
          text: getTextFromPhrasingContent(
            node.children,
            buildElements as BuildElementsFromPhrasingContentFn
          ),
        }),
        inlineCode: (node) => ({
          text: node.value,
          code: true,
        }),
        table: (node, buildElements) => ({
          type: kSlateBlockTypeCode,
          lang: 'markdown',
          text: getTableCode(
            node.children,
            buildElements as BuildElementsFromPhrasingContentFn
          ),
        }),
        heading: (node, buildElements) => ({
          type: depthToHeadingType(node.depth),
          children: ensureChildren(buildElements(node.children)),
        }),
        blockquote: (node, buildElements) => ({
          type: kSlateBlockTypeQuote,
          children: ensureChildren(buildElements(node.children)),
        }),
        paragraph: (node, buildElements) => ({
          type: kSlateBlockTypeParagraph,
          children: ensureChildren(buildElements(node.children)),
        }),
        thematicBreak: () => ({
          type: kSlateBlockTypeBreak,
          children: ensureChildren([]),
        }),
        list: (node, buildElements) => ({
          type: node.ordered
            ? kSlateBlockTypeOrderedList
            : kSlateBlockTypeUnorderedList,
          children: ensureChildren(buildElements(node.children)),
        }),
        listItem: (node, buildElements) => ({
          type: kSlateBlockTypeListItem,
          checked: node.checked ?? undefined,
          children: ensureChildren(
            getListItemChildren(node.children, buildElements)
          ),
        }),
        code: (node) => ({
          type: kSlateBlockTypeCode,
          children: [{ text: node.value }],
          lang: node.lang,
          meta: node.meta || undefined,
        }),
        link: (node, buildElements) => ({
          type: kSlateBlockTypeLink,
          url: node.url,
          title: node.title || undefined,
          children: ensureChildren(buildElements(node.children)),
        }),
        image: (node) => ({
          type: kSlateBlockTypeImage,
          url: node.url,
          title: node.title || undefined,
          alt: node.alt || undefined,
          children: ensureChildren([]),
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
        [kSlateBlockTypeH1]: (node, buildElements) => ({
          type: 'heading',
          depth: 1,
          children: buildElements((node as CustomElement).children),
        }),
        [kSlateBlockTypeH2]: (node, buildElements) => ({
          type: 'heading',
          depth: 2,
          children: buildElements((node as CustomElement).children),
        }),
        [kSlateBlockTypeH3]: (node, buildElements) => ({
          type: 'heading',
          depth: 3,
          children: buildElements((node as CustomElement).children),
        }),
        [kSlateBlockTypeH4]: (node, buildElements) => ({
          type: 'heading',
          depth: 4,
          children: buildElements((node as CustomElement).children),
        }),
        [kSlateBlockTypeH5]: (node, buildElements) => ({
          type: 'heading',
          depth: 5,
          children: buildElements((node as CustomElement).children),
        }),
        [kSlateBlockTypeH6]: (node, buildElements) => ({
          type: 'heading',
          depth: 6,
          children: buildElements((node as CustomElement).children),
        }),
        [kSlateBlockTypeUnorderedList]: (node, buildElements) => {
          return {
            type: 'list',
            ordered: false,
            children: buildElements((node as UnorderedListElement).children),
          }
        },
        [kSlateBlockTypeOrderedList]: (node, buildElements) => ({
          type: 'list',
          ordered: true,
          children: buildElements((node as OrderedListElement).children),
        }),
        [kSlateBlockTypeListItem]: (node, buildElements) => {
          return {
            type: 'listItem',
            checked: (node as CheckListItemElement).checked,
            children: buildElements((node as CheckListItemElement).children),
          }
        },
        [kSlateBlockTypeListCheckItem]: (node, buildElements) => {
          return {
            type: 'listItem',
            ordered: true,
            checked: (node as CheckListItemElement).checked,
            children: buildElements((node as CheckListItemElement).children),
          }
        },
        [kSlateBlockTypeBreak]: (node, buildElements) => ({
          type: 'thematicBreak',
          children: buildElements((node as ThematicBreakElement).children),
        }),
        [kSlateBlockTypeCode]: (node, buildElements) => {
          const { children, lang, meta } = node as CodeBlockElement
          return {
            type: 'code',
            children: buildElements(children),
            lang,
            meta,
          }
        },
        [kSlateBlockTypeParagraph]: (node, buildElements) => ({
          type: 'paragraph',
          children: buildElements((node as ParagraphElement).children),
        }),
        [kSlateBlockTypeQuote]: (node, buildElements) => ({
          type: 'blockquote',
          children: buildElements((node as BlockQuoteElement).children),
        }),
        [kSlateBlockTypeImage]: (node) => {
          const { url, title, alt } = node as ImageElement
          return { type: 'image', url, title, alt }
        },
        [kSlateBlockTypeLink]: (node, buildElements) => ({
          type: 'link',
          children: buildElements((node as LinkElement).children),
        }),
      },
    })
    .use(stringify)
  const ast = processor.runSync({
    type: 'root',
    // @ts-ignore: Argument of type '{ type: string; children: (CustomText | HeadingElement | ThematicBreakElement | UnorderedListElement | ... 8 more ... | LinkElement)[]; }' is not assignable to parameter of type 'Node<Data>'.
    children,
  })
  const text = processor.stringify(ast)
  return text
}
