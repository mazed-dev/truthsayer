import React from 'react'

import { markdownToDraft, docToMarkdown } from './conv.jsx'

import {
  TChunk,
  TDraftDoc,
  TContentBlock,
  kBlockTypeAtomic,
  kBlockTypeCode,
  kBlockTypeH1,
  kBlockTypeH2,
  kBlockTypeH3,
  kBlockTypeH4,
  kBlockTypeH5,
  kBlockTypeH6,
  kBlockTypeHrule,
  kBlockTypeOrderedItem,
  kBlockTypeQuote,
  kBlockTypeUnorderedCheckItem,
  kBlockTypeUnorderedItem,
  kBlockTypeUnstyled,
  kEntityTypeLink,
  kEntityTypeTime,
  kEntityMutable,
  kEntityImmutable,
} from './../doc/types.jsx'

test('raw string', () => {
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

  const doc = markdownToDraft(md)

  doc.blocks.forEach((block) => {
    expect(block).toHaveProperty('key')
    expect(block).toHaveProperty('depth')
    expect(block).toHaveProperty('type')
    expect(block).toHaveProperty('text')
    expect(block).toHaveProperty('entityRanges')
    expect(block).toHaveProperty('inlineStyleRanges')
    expect([
      kBlockTypeAtomic,
      kBlockTypeCode,
      kBlockTypeH1,
      kBlockTypeH2,
      kBlockTypeH3,
      kBlockTypeH4,
      kBlockTypeH5,
      kBlockTypeH6,
      kBlockTypeHrule,
      kBlockTypeOrderedItem,
      kBlockTypeQuote,
      kBlockTypeUnorderedCheckItem,
      kBlockTypeUnorderedItem,
      kBlockTypeUnstyled,
    ]).toContain(block.type)
  })

  expect(doc.blocks[0].type).toStrictEqual(kBlockTypeH1)
  expect(doc.blocks[1].type).toStrictEqual(kBlockTypeH2)
  expect(doc.blocks[2].type).toStrictEqual(kBlockTypeH3)
  expect(doc.blocks[3].type).toStrictEqual(kBlockTypeH4)
  expect(doc.blocks[4].type).toStrictEqual(kBlockTypeH5)
  expect(doc.blocks[5].type).toStrictEqual(kBlockTypeH6)

  expect(doc.blocks[0].text).toStrictEqual('Header 1')
  expect(doc.blocks[1].text).toStrictEqual('Header 2')
  expect(doc.blocks[2].text).toStrictEqual('Header 3')
  expect(doc.blocks[3].text).toStrictEqual('Header 4')
  expect(doc.blocks[4].text).toStrictEqual('Header 5')
  expect(doc.blocks[5].text).toStrictEqual('Header 6')

  expect(doc.blocks[6].type).toStrictEqual(kBlockTypeUnorderedItem)
  expect(doc.blocks[7].type).toStrictEqual(kBlockTypeUnorderedItem)
  expect(doc.blocks[8].type).toStrictEqual(kBlockTypeUnorderedItem)
  expect(doc.blocks[9].type).toStrictEqual(kBlockTypeUnorderedItem)

  expect(doc.blocks[6].text).toStrictEqual('Schools')
  expect(doc.blocks[7].text).toStrictEqual('Travel history')
  expect(doc.blocks[8].text).toStrictEqual('Housing history')
  expect(doc.blocks[9].text).toStrictEqual('Passports')

  expect(doc.blocks[10].type).toStrictEqual(kBlockTypeUnstyled)
  expect(doc.blocks[10].text).toStrictEqual(
    'static_cast<typename std::remove_reference<T>::type&&>(t)'
  )

  expect(doc.blocks[11].type).toStrictEqual(kBlockTypeUnstyled)
  expect(doc.blocks[12].type).toStrictEqual(kBlockTypeHrule)
  expect(doc.blocks[13].type).toStrictEqual(kBlockTypeCode)
  expect(doc.blocks[14].type).toStrictEqual(kBlockTypeUnstyled)
  expect(doc.blocks[15].type).toStrictEqual(kBlockTypeQuote)

  expect(doc.blocks[16].type).toStrictEqual(kBlockTypeUnorderedCheckItem)
  expect(doc.blocks[17].type).toStrictEqual(kBlockTypeUnorderedCheckItem)

  expect(doc.blocks[16].text).toStrictEqual('Checlist item 1')
  expect(doc.blocks[17].text).toStrictEqual('Checlist item 2')

  expect(doc.blocks[18].type).toStrictEqual(kBlockTypeOrderedItem)
  expect(doc.blocks[19].type).toStrictEqual(kBlockTypeOrderedItem)
  expect(doc.blocks[20].type).toStrictEqual(kBlockTypeOrderedItem)

  expect(doc.blocks[21].type).toStrictEqual(kBlockTypeUnstyled)
  expect(doc.blocks[22].type).toStrictEqual(kBlockTypeUnstyled)

  //* dbg*/ doc.blocks.forEach((block) => {
  //* dbg*/   console.log("Block", block);
  //* dbg*/ });
  const mdSource = docToMarkdown(doc)

  //* dbg*/ console.log("Source", mdSource);
  expect(mdSource).toContain('# Header 1\n')
  expect(mdSource).toContain('\n## Header 2\n')
  expect(mdSource).toContain('\n### Header 3\n')
  expect(mdSource).toContain('\n#### Header 4\n')
  expect(mdSource).toContain('\n##### Header 5\n')
  expect(mdSource).toContain('\n###### Header 6\n')

  expect(mdSource).toContain('- Schools')
  expect(mdSource).toContain(
    '- [Travel history](wq8ksuip3t8x85eckumpsezhr4ek6qatraghtohr38khg)'
  )
  expect(mdSource).toContain(
    '\n`static_cast<typename std::remove_reference<T>::type&&>(t)`'
  )
  expect(mdSource).toContain('\n**Trees were swaying**')
  expect(mdSource).toContain(`\`\`\`python
s = \"Python syntax highlighting\"
print s
\`\`\``)
  expect(mdSource).toContain('\n| First H  | Second H |')
  expect(mdSource).toContain('\n| -------- | -------- |')
  expect(mdSource).toContain('\n| Cell 1-1 | Cell 1-2 |')
  expect(mdSource).toContain('\n| Cell 2-1 | Cell 2-2 |')

  expect(mdSource).toContain(
    '\n> Blockquotes are very handy in email to emulate reply text.'
  )
  expect(mdSource).toContain('\n> This line is part of the same quote.')
  expect(mdSource).toContain('\n- [ ] Checlist item 1')
  expect(mdSource).toContain('\n- [ ] Checlist item 2')
  expect(mdSource).toContain('\n1. Though gently')
  expect(mdSource).toContain(
    '\n![Stormtroopocat](https://octodex.github.com/images/stormtroopocat.jpg)'
  )
  expect(mdSource).toContain('\n"2021 May 01 Saturday"')
})
