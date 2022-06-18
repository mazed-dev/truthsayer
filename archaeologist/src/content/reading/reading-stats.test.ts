import { getWordCount, getTimeToRead } from './reading-stats'

const kMultilineText = `
Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem
Ipsum has been the industry's standard dummy text ever since the 1500s, when an
unknown printer took a galley of type and scrambled it to make a type specimen
book. It has survived not only five centuries, but also the leap into electronic
typesetting, remaining essentially unchanged. It was popularised in the 1960s
with the release of Letraset sheets containing Lorem Ipsum passages, and more
recently with desktop publishing software like Aldus PageMaker including
versions of Lorem Ipsum.
`
test('getWordCount', () => {
  expect(getWordCount('abc')).toStrictEqual(1)
  expect(getWordCount('Abc abc')).toStrictEqual(2)
  expect(getWordCount('Abc,abc')).toStrictEqual(2)
  expect(getWordCount('Abc, abc')).toStrictEqual(2)
  expect(getWordCount(kMultilineText)).toStrictEqual(92)
})

test('getTimeToRead', () => {
  expect(getTimeToRead('abc abc abc abc').asSeconds()).toStrictEqual(1)
  expect(getTimeToRead(kMultilineText).asSeconds()).toStrictEqual(23)
})
