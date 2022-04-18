import { makeParagraph, makeLeaf, TDoc } from './types'

test('exctractDocTitle - raw string', async () => {
  const text = 'RmdBzaGUgdHJpZWQgdG8gd2FzaCBvZm'
  const doc = new TDoc([makeParagraph([makeLeaf(text)])])
  const title = doc.genTitle()
  expect(title).toStrictEqual(text)
})

test('exctractDocTitle - empty object', () => {
  const doc = new TDoc([makeParagraph([makeLeaf('')])])
  const title = doc.genTitle()
  expect(title).toStrictEqual('Some page' + '\u2026')
})
