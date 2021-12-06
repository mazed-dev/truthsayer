import {
  exctractDocTitle,
  getPlainText,
  makeParagraph,
  makeLeaf,
  makeDoc,
} from './doc_util'
import { markdownToDraft } from '../markdown/draftjs'
import { markdownToSlate } from '../markdown/slate'

import lodash from 'lodash'

test('exctractDocTitle - raw string', async () => {
  const text = 'RmdBzaGUgdHJpZWQgdG8gd2FzaCBvZm'
  const doc = await makeDoc({ plain: text })
  const title = exctractDocTitle(doc.slate)
  expect(title).toStrictEqual(text)
})

test('exctractDocTitle - empty object', () => {
  const slate = [makeParagraph([makeLeaf('')])]
  const title = exctractDocTitle(slate)
  expect(title).toStrictEqual('Some page' + '\u2026')
})

test('getPlainText - draft', () => {
  const source: string = `
# Header 1
## Header 2

- Schools
- [Travel history](https://wq8k.su/ip3t8x85eckumpsezhr4ek6qatraghtohr38khg)
- [Housing history](94ogoxqapi84je7hkbt1qtt8k1oeycqc43haij57pimhn)

![Stormtroopocat](https://octodex.github.com/images/stormtroopocat.jpg "The Stormtroopocat")

__Trees were swaying__

[](@1618686400/YYYY-MMMM-DD-dddd)

-----`
  const texts = getPlainText({
    draft: markdownToDraft(source),
    slate: undefined,
    chunks: undefined,
  })
  expect(texts).toContain('Header 1')
  expect(texts).toContain('Header 2')
  expect(texts).toContain('Schools')
  expect(texts).toContain('Travel history')
  expect(texts).toContain('Housing history')
  expect(texts).toContain('Trees were swaying')
  expect(texts).toContain(
    'https://wq8k.su/ip3t8x85eckumpsezhr4ek6qatraghtohr38khg'
  )
  expect(texts).toContain('94ogoxqapi84je7hkbt1qtt8k1oeycqc43haij57pimhn')
  expect(texts).toContain(
    'Stormtroopocat https://octodex.github.com/images/stormtroopocat.jpg'
  )
  expect(lodash.last(texts)).toMatch(/2021-April-1.-[SMTWF].+day/)
})

test('getPlainText - slate', async () => {
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
  const texts = getPlainText({
    slate: await markdownToSlate(source),
    draft: undefined,
    chunks: undefined,
  })
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
  expect(lodash.last(texts)).toMatch(/2021-April-1.-[SMTWF].+day/)
})
