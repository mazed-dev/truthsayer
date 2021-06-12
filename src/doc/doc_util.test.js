import React from 'react'
import { render } from '@testing-library/react'
import { exctractDocTitle, enforceTopHeader } from './doc_util.jsx'
import { TDoc, TChunk, EChunkType } from './types'
import {
  makeChunk,
  makeAsteriskChunk,
  isHeaderChunk,
  isAsteriskChunk,
} from './chunk_util.jsx'

test('exctractDocTitle - raw string', () => {
  const text = 'RmdBzaGUgdHJpZWQgdG8gd2FzaCBvZm'
  const title = exctractDocTitle(text)
  expect(title).toStrictEqual(text)
})

test('exctractDocTitle - empty object', () => {
  const title = exctractDocTitle({})
  expect(title).toStrictEqual('Some page' + '\u2026')
})

test('exctractDocTitle - multiple chunks', () => {
  const text = 'RmdB zaGUgdHJpZWQgd G8gd2FzaCBvZm'
  const doc: TDoc = {
    chunks: [makeChunk(text), makeChunk('asdf'), , makeChunk('123')],
  }
  const title = exctractDocTitle(doc)
  expect(title).toStrictEqual(text)
})

test('enforceTopHeader - old style doc', () => {
  const text = 'RmdB zaGUgdHJpZWQgd G8gd2FzaCBvZm'
  const doc = enforceTopHeader(text)
  expect(isHeaderChunk(doc.chunks[0])).toStrictEqual(true)
  expect(isAsteriskChunk(doc.chunks[0])).toStrictEqual(true)
})
