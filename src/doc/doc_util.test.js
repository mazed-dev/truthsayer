import React from 'react'
import { render } from '@testing-library/react'
import {
  exctractDocTitle,
  enforceTopHeader,
  getPlainText,
  getDocSlate,
  makeParagraph,
  makeLeaf,
} from './doc_util.jsx'
import { TDoc, TChunk, EChunkType } from './types'
import {
  makeChunk,
  makeAsteriskChunk,
  isHeaderChunk,
  isAsteriskChunk,
} from './chunk_util.jsx'
import { markdownToDraft } from '../markdown/conv.jsx'
import { markdownToSlate } from '../markdown/slate.ts'

test('exctractDocTitle - raw string', async () => {
  const text = 'RmdBzaGUgdHJpZWQgdG8gd2FzaCBvZm'
  const doc = await getDocSlate(text)
  const title = exctractDocTitle(doc)
  expect(title).toStrictEqual(text)
})

test('exctractDocTitle - empty object', () => {
  const slate = [makeParagraph([makeLeaf()])]
  const title = exctractDocTitle(slate)
  expect(title).toStrictEqual('Some page' + '\u2026')
})

test('exctractDocTitle - multiple chunks', async () => {
  const text = 'RmdB zaGUgdHJpZWQgd G8gd2FzaCBvZm'
  const doc: TDoc = {
    chunks: [makeChunk(text), makeChunk('asdf'), , makeChunk('123')],
  }
  const title = exctractDocTitle(await getDocSlate(doc))
  expect(title).toStrictEqual(text)
})

test('getPlainText - chunks', () => {
  const text = 'RmdB zaGUgdHJpZWQgd G8gd2FzaCBvZm'
  const doc: TDoc = {
    chunks: [makeChunk(text), makeChunk('asdf'), , makeChunk('123')],
  }
  const texts = getPlainText(doc)
  expect(texts).toStrictEqual([text, 'asdf', '123'])
})

test('getPlainText - draft', () => {
  const source: string = `
# Header 1
## Header 2

- Schools
- [Travel history](https://wq8k.su/ip3t8x85eckumpsezhr4ek6qatraghtohr38khg)
- [Housing history](94ogoxqapi84je7hkbt1qtt8k1oeycqc43haij57pimhn)

![Stormtroopocat](https://octodex.github.com/images/stormtroopocat.jpg "The Stormtroopocat")

[](@1619823600/YYYY-MMMM-DD-dddd)

__Trees were swaying__
-----`
  const doc: TDoc = {
    draft: markdownToDraft(source),
  }
  const texts = getPlainText(doc)
  expect(texts).toStrictEqual([
    'Header 1',
    'Header 2',
    'Schools',
    'Travel history',
    'Housing history',
    '\n',
    '\n',
    'Trees were swaying',
    'https://wq8k.su/ip3t8x85eckumpsezhr4ek6qatraghtohr38khg',
    '94ogoxqapi84je7hkbt1qtt8k1oeycqc43haij57pimhn',
    'Stormtroopocat https://octodex.github.com/images/stormtroopocat.jpg',
    '2021-May-01-Saturday',
  ])
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

[](@1619823600/YYYY-MMMM-DD-dddd)

__Trees were swaying__

-----`
  const doc: TDoc = {
    slate: await markdownToSlate(source),
  }
  const texts = getPlainText(doc)
  expect(texts).toStrictEqual([
    'Header 1',
    'Header 2',
    'Emphasis, aka italics, with asterisks or underscores .',
    'Strong emphasis, aka bold, with asterisks or underscores .',
    'Combined emphasis with asterisks and underscores .',
    'Schools Travel history Housing history',
    'Inline-style link',
    '2021-May-01-Saturday',
    'Trees were swaying',
    'https://wq8k.su/ip3t8x85eckumpsezhr4ek6qatraghtohr38khg',
    '94ogoxqapi84je7hkbt1qtt8k1oeycqc43haij57pimhn',
    'https://github.com',
    'https://octodex.github.com/images/stormtroopocat.jpg',
    'Stormtroopocat',
    '2021-May-01-Saturday',
  ])
})
