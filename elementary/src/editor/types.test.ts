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
  expect(title).toStrictEqual('…')
})

test('exctractDocTitle - make sure wide (unicode) characters are not cut in half', () => {
  const ustr = '☀️🐥📦⏳☕️💡🏗'.repeat(100)
  const doc = new TDoc([makeParagraph([makeLeaf(ustr)])])
  const title = doc.genTitle(19)
  expect(title).toStrictEqual('☀️🐥📦⏳☕️💡🏗☀️🐥📦⏳☕️💡🏗☀️🐥📦⏳…')
})
