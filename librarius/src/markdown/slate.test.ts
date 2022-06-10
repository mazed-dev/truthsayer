// @ts-nocheck

import type { Descendant } from 'slate'

import { slateToMarkdown, _siftUpBlocks } from './slate'
import { markdownToSlate } from './slate-remark'

import {
  kSlateBlockTypeBreak,
  kSlateBlockTypeCode,
  kSlateBlockTypeListItem,
  kSlateBlockTypeDateTime,
  kSlateBlockTypeH1,
  kSlateBlockTypeH2,
  kSlateBlockTypeH3,
  kSlateBlockTypeH4,
  kSlateBlockTypeH5,
  kSlateBlockTypeH6,
  kSlateBlockTypeImage,
  kSlateBlockTypeOrderedList,
  kSlateBlockTypeParagraph,
  kSlateBlockTypeQuote,
  kSlateBlockTypeUnorderedList,
  kSlateBlockTypeListCheckItem,
  TDoc,
} from 'elementary'

test.only('Markdown to Slate state', () => {
  const md = `
# Header 1
## Header 2
### Header 3
#### Header 4
##### Header 5
###### Header 6

Alternative heading level 1
===============

- Schools
- [Travel history](wq8ksuip3t8x85eckumpsezhr4ek6qatraghtohr38khg)
- Passports

\`static_cast<typename std::remove_reference<T>::type&&>(t)\`

__Trees were swaying__

-----

\`\`\`python
s = "Python syntax highlighting"
print s
\`\`\`

| First H  | Second H |
| -------- | -------- |
| Cell 1-1 | Cell 1-2 |
| Cell 2-1 | Cell 2-2 |

> Blockquotes are very handy in email to emulate reply text.
> This line is part of the same quote.

- [ ] checklist item 1
- [ ] checklist item 2

1. Though gently
1. The ability to approach every
1. The protesters here certainly

![Stormtroopocat](https://octodex.github.com/images/stormtroopocat.jpg "The Stormtroopocat")

[](@1619823600/day)
`
  const value = markdownToSlate(md)
  value.forEach((block) => {
    expect(block).toHaveProperty('type')
    expect(block).toHaveProperty('children')
  })
  expect(value[0]).toStrictEqual({
    type: kSlateBlockTypeH1,
    children: [
      {
        text: 'Header 1',
      },
    ],
  })
  expect(value[1]).toStrictEqual({
    type: kSlateBlockTypeH2,
    children: [
      {
        text: 'Header 2',
      },
    ],
  })
  expect(value[2]).toStrictEqual({
    type: kSlateBlockTypeH3,
    children: [
      {
        text: 'Header 3',
      },
    ],
  })
  expect(value[3]).toStrictEqual({
    type: kSlateBlockTypeH4,
    children: [
      {
        text: 'Header 4',
      },
    ],
  })
  expect(value[4]).toStrictEqual({
    type: kSlateBlockTypeH5,
    children: [
      {
        text: 'Header 5',
      },
    ],
  })
  expect(value[5]).toStrictEqual({
    type: kSlateBlockTypeH6,
    children: [
      {
        text: 'Header 6',
      },
    ],
  })
  expect(value[6]).toStrictEqual({
    type: kSlateBlockTypeH1,
    children: [
      {
        text: 'Alternative heading level 1',
      },
    ],
  })
  expect(value[7]).toStrictEqual({ type: kSlateBlockTypeUnorderedList,
    children: [
         {
           children: [
             {
               children: [
                 {
                   text: "Schools",
                 },
               ],
               type: kSlateBlockTypeParagraph,
             },
           ],
           type: kSlateBlockTypeListItem,
         },
         {
           children: [
             {
               children: [
                 {
                   children: [
                     {
                       "text": "Travel history",
                     },
                   ],
                   title: undefined,
                   type: "-link",
                   url: "wq8ksuip3t8x85eckumpsezhr4ek6qatraghtohr38khg",
                 },
               ],
               type: kSlateBlockTypeParagraph,
             },
           ],
           type: kSlateBlockTypeListItem,
         },
         {
           children: [
             {
               children: [
                 {
                   "text": "Passports",
                 },
               ],
               type: kSlateBlockTypeParagraph,
             },
           ],
           type: kSlateBlockTypeListItem,
         },
       ],
  })
  expect(value[8]).toStrictEqual({ type: kSlateBlockTypeParagraph,
    children: [
         {
           code: true,
           text: "static_cast<typename std::remove_reference<T>::type&&>(t)",
         },
       ],

  })
  expect(value[9]).toStrictEqual({ type: kSlateBlockTypeParagraph,
})

test('Slate state to Markdown', () => {
  const headerText: string =
    '#0413321!149761a' +
    '23 # 43 c' +
    '24 $ 44 d' +
    '25 % 45 e' +
    '28 ( 50 h' +
    '29 ) 51 i' +
    '2A * 52 j' +
    '2B + 53 k'
  const paragraphText: string =
    '2C , 54 l' +
    '2D - 55 m' +
    '2E . 56 n' +
    '2F / 57 o' +
    '30 0 60 p' +
    '31 1 61 q' +
    '32 2 62 r' +
    '33 3 63 s' +
    '34 4 64 t' +
    '35 5 65 u' +
    '36 6 66 v' +
    '37 7 67 w' +
    '38 8 70 x' +
    '39 9 71 y' +
    `3A : 72 z` +
    '3B ; 73 {'
  const state: Descendant[] = [
    {
      type: kSlateBlockTypeH2,
      children: [
        {
          text: headerText,
        },
      ],
    },
    {
      type: kSlateBlockTypeParagraph,
      children: [
        {
          text: paragraphText,
        },
      ],
    },
  ]
  const md: string = slateToMarkdown(state)
  expect(md).toStrictEqual(`## ${headerText}\n${paragraphText}\n`)
})

test('Checklist in Markdown', () => {
  const md: string = `
- [x] Drink a glass of water
- [X] Make your bed
- [ ] Get moving
- [ ] Stay unplugged
- [x] Sneak in a little me-time
  `
  const value = markdownToSlate(md)
  expect(value.length).toStrictEqual(1)
  const { children, type } = value[0]
  expect(type).toStrictEqual(kSlateBlockTypeUnorderedList)
  expect(children.length).toStrictEqual(5)
  expect(children[0].checked).toStrictEqual(true)
  expect(children[1].checked).toStrictEqual(true)
  expect(children[2].checked).toStrictEqual(false)
  expect(children[3].checked).toStrictEqual(false)
  expect(children[4].checked).toStrictEqual(true)

  expect(children[0].children[0].text).toStrictEqual('Drink a glass of water')
  expect(children[1].children[0].text).toStrictEqual('Make your bed')
  expect(children[2].children[0].text).toStrictEqual('Get moving')
  expect(children[3].children[0].text).toStrictEqual('Stay unplugged')
  expect(children[4].children[0].text).toStrictEqual(
    'Sneak in a little me-time'
  )
})

test('Multi checklist in Markdown', () => {
  const md: string = `
- [x] First
  - [x] aaa
  - [ ] bbb
  - [X] ccc
  - [x] ddd
- [ ] Second
  - [ ] AAA
  - [x] BBB
  - [X] CCC
  `
  const value = markdownToSlate(md)
  expect(value.length).toStrictEqual(1)
  const { children, type } = value[0]
  expect(type).toStrictEqual(kSlateBlockTypeUnorderedList)
  expect(children.length).toStrictEqual(2)

  expect(children[0].children.length).toStrictEqual(2)
  expect(children[1].children.length).toStrictEqual(2)

  // 0
  expect(children[0].checked).toStrictEqual(true)
  expect(children[0].type).toStrictEqual(kSlateBlockTypeListCheckItem)
  expect(children[0].children[0].text).toStrictEqual('First')
  // 1
  expect(children[1].checked).toStrictEqual(false)
  expect(children[1].type).toStrictEqual(kSlateBlockTypeListCheckItem)
  expect(children[1].children[0].text).toStrictEqual('Second')
  // 0.0
  expect(children[0].children[1].children[0].checked).toStrictEqual(true)
  expect(children[0].children[1].children[0].type).toStrictEqual(
    kSlateBlockTypeListCheckItem
  )
  expect(children[0].children[1].children[0].children[0].text).toStrictEqual(
    'aaa'
  )
  // 0.1
  expect(children[0].children[1].children[1].checked).toStrictEqual(false)
  expect(children[0].children[1].children[1].type).toStrictEqual(
    kSlateBlockTypeListCheckItem
  )
  expect(children[0].children[1].children[1].children[0].text).toStrictEqual(
    'bbb'
  )
  // 0.2
  expect(children[0].children[1].children[2].checked).toStrictEqual(true)
  expect(children[0].children[1].children[2].type).toStrictEqual(
    kSlateBlockTypeListCheckItem
  )
  expect(children[0].children[1].children[2].children[0].text).toStrictEqual(
    'ccc'
  )
  // 0.3
  expect(children[0].children[1].children[3].checked).toStrictEqual(true)
  expect(children[0].children[1].children[3].type).toStrictEqual(
    kSlateBlockTypeListCheckItem
  )
  expect(children[0].children[1].children[3].children[0].text).toStrictEqual(
    'ddd'
  )
  // 1.0
  expect(children[1].children[1].children[0].checked).toStrictEqual(false)
  expect(children[1].children[1].children[0].type).toStrictEqual(
    kSlateBlockTypeListCheckItem
  )
  expect(children[1].children[1].children[0].children[0].text).toStrictEqual(
    'AAA'
  )
  // 1.1
  expect(children[1].children[1].children[1].checked).toStrictEqual(true)
  expect(children[1].children[1].children[1].type).toStrictEqual(
    kSlateBlockTypeListCheckItem
  )
  expect(children[1].children[1].children[1].children[0].text).toStrictEqual(
    'BBB'
  )
  // 1.2
  expect(children[1].children[1].children[2].checked).toStrictEqual(true)
  expect(children[1].children[1].children[2].type).toStrictEqual(
    kSlateBlockTypeListCheckItem
  )
  expect(children[1].children[1].children[2].children[0].text).toStrictEqual(
    'CCC'
  )
})

test('Extra(backward): links as date', () => {
  const md: string = `[](@1619823600/day)`
  const value = markdownToSlate(md)
  expect(value.length).toStrictEqual(1)
  const { children } = value[0]
  expect(children.length).toStrictEqual(1)
  const { type, timestamp } = children[0]
  expect(type).toStrictEqual(kSlateBlockTypeDateTime)
  expect(timestamp).toStrictEqual(1619823600)
})

test('Extra(back-and-forth): checklists', () => {
  const md: string = `
- [x] First o+0Gl42yGkGxspc 3YO
  - [x] aaa Toss2wiF/dfVpkJzAun
  - [ ] bbb wSYMkIcQpy0JE2D Nx+
  - [x] ccc v79bsklHud8EV1GcTa1
  - [x] ddd Ds7cACvsmaf QL/8O
- [ ] Second g3PDAxteeS9mpBjI4sD
  - [ ] AAA +uEa3sjXKETaAis44O
  - [x] BBB iVUd+eqy5OUq/XIymhP
  - [x] CCC +92+5kenT/8K ObrJ
`
  const value = markdownToSlate(md)
  let backMd: string = slateToMarkdown(value)
  backMd = backMd.replace('\n\n', '')
  expect(backMd.trim()).toStrictEqual(md.trim())
})

test('Extra(backward): links as date and back', async () => {
  const md: string = `QrPSc [](@1618686400/day) nk8SGb`
  const value = markdownToSlate(md)
  expect(value.length).toStrictEqual(1)
  const backMd: string = slateToMarkdown(value)
  // To match the same time in different timezones depending on the locale
  expect(backMd.trim()).toMatch(/^QrPSc 2021 April 1., .+day nk8SGb$/)
})

test('Extra(image): only top level images', async () => {
  const root = [
    {
      type: 'paragraph',
      children: [
        {
          type: 'image',
          children: [
            {
              text: '',
            },
          ],
          link: 'https://riptutorial.com/Images/logo_rip_full_white.png',
          caption: 'Publisher Logo',
        },
        {
          text: 'We value your privacy',
        },
      ],
    },
    {
      type: 'paragraph',
      children: [
        {
          text: 'We and our',
        },
      ],
    },
    {
      type: 'paragraph',
      children: [
        {
          text: 'store and/or access information on a device.',
        },
      ],
    },
  ]
  const newContents = _siftUpBlocks(root)
  expect(newContents).toStrictEqual([
    {
      type: 'image',
      children: [
        {
          text: '',
        },
      ],
      link: 'https://riptutorial.com/Images/logo_rip_full_white.png',
      caption: 'Publisher Logo',
    },
    {
      type: 'paragraph',
      children: [
        {
          text: 'We value your privacy',
        },
      ],
    },
    {
      type: 'paragraph',
      children: [
        {
          text: 'We and our',
        },
      ],
    },
    {
      type: 'paragraph',
      children: [
        {
          text: 'store and/or access information on a device.',
        },
      ],
    },
  ])
})

test('Extra(list hack): from md and back', () => {
  const md = `- QfCCz 7uBC D13Vqj/mjm
- Y lpeidC iCPUfx f4lpFuLU
- Gb KxYtZ p6vAdVQG8z/Orc`
  const value = markdownToSlate(md)
  const backMd = slateToMarkdown(value)
  expect(backMd.trim()).toStrictEqual(md)
})

test('getPlainText - slate', () => {
  const source: string = `
# Header 1
## Header 2

Emphasis, aka italics, with *asterisks* or _underscores_.

Strong emphasis, aka bold, with **asterisks** or __underscores__.

Combined emphasis with **asterisks and _underscores_**.

- Schools
- [Travel history](https://wq8k.su/ip3t8x85eckumpsezhr4ek6qatraghtohr38khg)
- [Housing history](94ogoxqapi84je7hkbt1qtt8k1oeycqc43haij57pimhn)

[Inline-style link](https://github.com)

![Stormtroopocat](https://octodex.github.com/images/stormtroopocat.jpg "The Stormtroopocat")

__Trees were swaying__

[](@1618686400/YYYY-MMMM-DD-dddd)

-----`
  const doc = new TDoc(markdownToSlate(source))
  const texts = doc.genPlainText()
  expect(texts).toContain('Header 1')
  expect(texts).toContain('Header 2')
  expect(texts).toContain(
    'Emphasis, aka italics, with asterisks or underscores .'
  )
  expect(texts).toContain(
    'Strong emphasis, aka bold, with asterisks or underscores .'
  )
  expect(texts).toContain('Combined emphasis with asterisks and underscores .')
  expect(texts).toContain('Schools Travel history Housing history')
  expect(texts).toContain('Inline-style link')
  expect(texts).toContain('Trees were swaying')
  expect(texts).toContain(
    'https://wq8k.su/ip3t8x85eckumpsezhr4ek6qatraghtohr38khg'
  )
  expect(texts).toContain('94ogoxqapi84je7hkbt1qtt8k1oeycqc43haij57pimhn')
  expect(texts).toContain('https://github.com')
  expect(texts).toContain(
    'https://octodex.github.com/images/stormtroopocat.jpg'
  )
  expect(texts).toContain('Stormtroopocat')
  expect(texts[texts.length - 1]).toMatch(/2021-April-1.-[SMTWF].+day/)
})
