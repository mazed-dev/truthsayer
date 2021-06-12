import React from 'react'

import { Descendant } from 'slate'

import { slateToMarkdown, markdownToSlate } from './slate.ts'

import {
  kSlateDescTypeH1,
  kSlateDescTypeH2,
  kSlateDescTypeH3,
  kSlateDescTypeH4,
  kSlateDescTypeH5,
  kSlateDescTypeH6,
  kSlateDescTypeBreak,
  kSlateDescTypeCode,
  kSlateDescTypeOrderedList,
  kSlateDescTypeParagraph,
  kSlateDescTypeQuote,
  kSlateDescTypeUnorderedList,
} from './../doc/types.ts'

test('Markdown to Slate state', async () => {
  const md = `
# Header 1
## Header 2
### Header 3
#### Header 4
##### Header 5
###### Header 6

- Schools
- [Travel history](wq8ksuip3t8x85eckumpsezhr4ek6qatraghtohr38khg)
- [Housing history](94ogoxqapi84je7hkbt1qtt8k1oeycqc43haij57pimhn)
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

- [ ] Checlist item 1
- [ ] Checlist item 2

1. Though gently
1. The ability to approach every
1. The protesters here certainly

![Stormtroopocat](https://octodex.github.com/images/stormtroopocat.jpg "The Stormtroopocat")

[](@1619823600/day)
`

  const value = await markdownToSlate(md)
  value.forEach((block) => {
    expect(block).toHaveProperty('type')
    expect(block).toHaveProperty('children')
  })
  expect(value[0].type).toStrictEqual(kSlateDescTypeH1)
  expect(value[1].type).toStrictEqual(kSlateDescTypeH2)
  expect(value[2].type).toStrictEqual(kSlateDescTypeH3)
  expect(value[3].type).toStrictEqual(kSlateDescTypeH4)
  expect(value[4].type).toStrictEqual(kSlateDescTypeH5)
  expect(value[5].type).toStrictEqual(kSlateDescTypeH6)
  expect(value[6].type).toStrictEqual(kSlateDescTypeUnorderedList)
  expect(value[7].type).toStrictEqual(kSlateDescTypeParagraph)
  expect(value[8].type).toStrictEqual(kSlateDescTypeParagraph)
  expect(value[9].type).toStrictEqual(kSlateDescTypeBreak)
  expect(value[10].type).toStrictEqual(kSlateDescTypeCode)
  expect(value[11].type).toStrictEqual(kSlateDescTypeParagraph)
  expect(value[12].type).toStrictEqual(kSlateDescTypeQuote)
  expect(value[13].type).toStrictEqual(kSlateDescTypeUnorderedList)
  expect(value[14].type).toStrictEqual(kSlateDescTypeOrderedList)
  expect(value[15].type).toStrictEqual(kSlateDescTypeParagraph)
  expect(value[16].type).toStrictEqual(kSlateDescTypeParagraph)

  expect(value[0].children[0].text).toStrictEqual('Header 1')
  expect(value[1].children[0].text).toStrictEqual('Header 2')
  expect(value[2].children[0].text).toStrictEqual('Header 3')
  expect(value[3].children[0].text).toStrictEqual('Header 4')
  expect(value[4].children[0].text).toStrictEqual('Header 5')
  expect(value[5].children[0].text).toStrictEqual('Header 6')
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
      type: kSlateDescTypeH2,
      children: [
        {
          text: headerText,
        },
      ],
    },
    {
      type: kSlateDescTypeParagraph,
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
