import type { Descendant } from 'slate'

import { markdownToSlate, slateToMarkdown } from './slate-remark'

import {
  kSlateBlockTypeBreak,
  kSlateBlockTypeCode,
  kSlateBlockTypeListItem,
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
  TDoc,
} from 'elementary'

test('Markdown to Slate state - headers', () => {
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
  expect(value[7]).toStrictEqual({
    type: kSlateBlockTypeUnorderedList,
    children: [
      {
        children: [
          {
            text: 'Schools',
          },
        ],
        type: kSlateBlockTypeListItem,
        checked: undefined,
      },
      {
        children: [
          {
            children: [
              {
                text: 'Travel history',
              },
            ],
            title: undefined,
            type: '-link',
            url: 'wq8ksuip3t8x85eckumpsezhr4ek6qatraghtohr38khg',
          },
        ],
        type: kSlateBlockTypeListItem,
        checked: undefined,
      },
      {
        children: [
          {
            text: 'Passports',
          },
        ],
        type: kSlateBlockTypeListItem,
        checked: undefined,
      },
    ],
  })
  expect(value[8]).toStrictEqual({
    type: kSlateBlockTypeParagraph,
    children: [
      {
        code: true,
        text: 'static_cast<typename std::remove_reference<T>::type&&>(t)',
      },
    ],
  })
})

test('Markdown to Slate state - Bold', () => {
  const md = `
**Trees were swaying**
`
  const value = markdownToSlate(md)
  // FIXME(akindyakov): I did't find quickly how to make text styles work with
  // this new remark-slate-transformer framework. Skippping this for now, will
  // get back to it later on.
  expect(value[0]).toStrictEqual({
    type: kSlateBlockTypeParagraph,
    children: [
      {
        bold: true,
        text: 'Trees were swaying',
      },
    ],
  })
})

test('Markdown to Slate state - Thematic break', () => {
  const md = `
Text before

---

Text after
`
  const value = markdownToSlate(md)
  expect(value[1]).toStrictEqual({
    type: kSlateBlockTypeBreak,
    children: [{ text: '' }],
  })
})

test('Markdown to Slate state - Italic && Bold', () => {
  const md = `
_There are many variations of passages_

__of Lorem Ipsum available__
`
  const value = markdownToSlate(md)
  expect(value[0]).toStrictEqual({
    type: kSlateBlockTypeParagraph,
    children: [
      {
        italic: true,
        text: 'There are many variations of passages',
      },
    ],
  })
  expect(value[1]).toStrictEqual({
    type: kSlateBlockTypeParagraph,
    children: [
      {
        bold: true,
        text: 'of Lorem Ipsum available',
      },
    ],
  })
})

test('Markdown to Slate state - Code Block', () => {
  const md = `
\`\`\`python
s = "Python syntax highlighting"
print s
\`\`\`
`
  const value = markdownToSlate(md)
  expect(value[0]).toStrictEqual({
    type: kSlateBlockTypeCode,
    lang: 'python',
    meta: undefined,
    children: [
      {
        text: `s = "Python syntax highlighting"
print s`,
      },
    ],
  })
})

test('Markdown to Slate state - Table (not supported by Mazed yet)', () => {
  // Tables simply are not supported by Mazed yet
  const md = `| First H  | Second H |
| -------- | -------- |
| Cell 1-1 | Cell 1-2 |
| Cell 2-1 | Cell 2-2 |`
  const value = markdownToSlate(md)
  expect(value[0]).toStrictEqual({
    type: kSlateBlockTypeCode,
    lang: 'markdown',
    text: `| First H | Second H |
| Cell 1-1 | Cell 1-2 |
| Cell 2-1 | Cell 2-2 |`,
  })
})

test('Markdown to Slate state - Blockquote', () => {
  const md = `
> Blockquotes are very handy in email to emulate reply text.
> This line is part of the same quote.
`
  const value = markdownToSlate(md)
  expect(value[0]).toStrictEqual({
    type: kSlateBlockTypeQuote,
    children: [
      {
        type: kSlateBlockTypeParagraph,
        children: [
          {
            text: 'Blockquotes are very handy in email to emulate reply text.\nThis line is part of the same quote.',
          },
        ],
      },
    ],
  })
})

test('Markdown to Slate state - Checklist', () => {
  const md = `
* [ ] Mauris tempus est dolor, vitae rutrum nunc volutpat nec.
* [x] Fusce arcu enim.
`
  const value = markdownToSlate(md)
  expect(value[0]).toStrictEqual({
    type: kSlateBlockTypeUnorderedList,
    children: [
      {
        children: [
          {
            text: 'Mauris tempus est dolor, vitae rutrum nunc volutpat nec.',
          },
        ],
        checked: false,
        type: 'list-item',
      },
      {
        children: [
          {
            text: 'Fusce arcu enim.',
          },
        ],
        checked: true,
        type: 'list-item',
      },
    ],
  })
})

test('Markdown to Slate state - Ordered list', () => {
  const md = `
1. Though gently
1. The ability to approach every
1. The protesters here certainly
`
  const value = markdownToSlate(md)
  expect(value[0]).toStrictEqual({
    children: [
      {
        checked: undefined,
        children: [
          {
            text: 'Though gently',
          },
        ],
        type: 'list-item',
      },
      {
        checked: undefined,
        children: [
          {
            text: 'The ability to approach every',
          },
        ],
        type: 'list-item',
      },
      {
        checked: undefined,
        children: [
          {
            text: 'The protesters here certainly',
          },
        ],
        type: 'list-item',
      },
    ],
    type: kSlateBlockTypeOrderedList,
  })
})

test('Markdown to Slate state - MD native image', () => {
  const md = `
![Stormtroopocat - github](https://octodex.github.com/images/stormtroopocat.jpg "The Stormtroopocat")
`
  const value = markdownToSlate(md)
  expect(value[0]).toStrictEqual({
    type: kSlateBlockTypeParagraph,
    children: [
      {
        type: kSlateBlockTypeImage,
        title: 'The Stormtroopocat',
        alt: 'Stormtroopocat - github',
        url: 'https://octodex.github.com/images/stormtroopocat.jpg',
        children: [{ text: '' }],
      },
    ],
  })
})

test('Markdown to Slate state - inline code', () => {
  const md = 'This would be an `<input type="checkbox">` element'
  const value = markdownToSlate(md)
  expect(value[0]).toStrictEqual({
    type: kSlateBlockTypeParagraph,
    children: [
      {
        text: 'this would be an ',
      },
      {
        code: true,
        text: '<input type="checkbox">',
      },
      {
        text: ' element',
      },
    ],
  })
})

test('Slate state to Markdown', () => {
  const headerText: string =
    '#0413321!149761a' +
    '23 # 43 c' +
    '24 $ 44 d' +
    '25 % 45 e' +
    '28 ( 50 h' +
    '29 ) 51 i' +
    '2A ^ 52 j' +
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
  expect(md).toStrictEqual(`## ${headerText}\n\n${paragraphText}\n`)
})

test.skip('Extra(back-and-forth): checklists', () => {
  // FIXME(akindyakov): GitHub task lists serializatino doesn't work
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
  const backMd: string = slateToMarkdown(value)
  expect(backMd.trim()).toStrictEqual(md.trim())
})

test('Extra(list hack): from md and back', () => {
  const md = `*   QfCCz 7uBC D13Vqj/mjm

*   Y lpeidC iCPUfx f4lpFuLU

*   Gb KxYtZ p6vAdVQG8z/Orc`
  const value = markdownToSlate(md)
  const backMd = slateToMarkdown(value)
  expect(backMd.trim()).toStrictEqual(md)
})

const kRepeatingSpacesRe = /\s+/g
test('TDoc getPlainText - slate', () => {
  const source: string = `
# Header 1
## Header 2

Emphasis, aka italics, with *asterisks* or _underscores_.

Strong emphasis, aka bold, with **asterisks** or __underscores__.

- Schools
- [Travel history](https://wq8k.su/ip3t8x85eckumpsezhr4ek6qatraghtohr38khg)
- [Housing history](94ogoxqapi84je7hkbt1qtt8k1oeycqc43haij57pimhn)

[Inline-style link](https://github.com)

![Stormtroopocat alt](https://octodex.github.com/images/stormtroopocat.jpg "The Stormtroopocat")

__Trees were swaying__

-----`
  const doc = new TDoc(markdownToSlate(source))
  const plaintext = doc.genPlainText().replaceAll(kRepeatingSpacesRe, ' ')
  expect(plaintext).toContain('Header 1')
  expect(plaintext).toContain('Header 2')
  expect(plaintext).toContain(
    'Emphasis, aka italics, with asterisks or underscores'
  )
  expect(plaintext).toContain(
    'Strong emphasis, aka bold, with asterisks or underscores'
  )
  expect(plaintext).toContain('Schools Travel history Housing history')
  expect(plaintext).toContain('Inline-style link')
  expect(plaintext).toContain('Trees were swaying')
  expect(plaintext).toContain(
    'https://wq8k.su/ip3t8x85eckumpsezhr4ek6qatraghtohr38khg'
  )
  expect(plaintext).toContain('94ogoxqapi84je7hkbt1qtt8k1oeycqc43haij57pimhn')
  expect(plaintext).toContain('https://github.com')
  expect(plaintext).toContain(
    'https://octodex.github.com/images/stormtroopocat.jpg'
  )
  expect(plaintext).toContain('The Stormtroopocat')
  expect(plaintext).toContain('Stormtroopocat alt')
})
