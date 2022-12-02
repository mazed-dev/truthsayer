import { getKeyPhraseFromText } from './keyphrase'

test('getKeyPhraseFromText.last-sentence', () => {
  const keyphrase = getKeyPhraseFromText(
    `A type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.`
  )
  expect(keyphrase).toStrictEqual(
    'It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum'
  )
})

test('getKeyPhraseFromText.from-last-//', () => {
  expect(
    getKeyPhraseFromText(
      `A type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like //Aldus PageMaker including versions of Lorem Ipsum.`
    )
  ).toStrictEqual('Aldus PageMaker including versions of Lorem Ipsum')
  expect(
    getKeyPhraseFromText(
      `It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like // Aldus PageMaker including versions of Lorem Ipsum.`
    )
  ).toStrictEqual('Aldus PageMaker including versions of Lorem Ipsum')
  expect(
    getKeyPhraseFromText(
      `It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop // publishing software like // Aldus PageMaker including versions of Lorem Ipsum.`
    )
  ).toStrictEqual('Aldus PageMaker including versions of Lorem Ipsum')
  expect(
    getKeyPhraseFromText(
      `It has survived not only five centuries, but also // the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.`
    )
  ).toStrictEqual(
    'It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum'
  )
  expect(getKeyPhraseFromText(`Lorem Ipsum//`)).toStrictEqual(null)
})

test('getKeyPhraseFromText.end-of-the-line', () => {
  expect(
    getKeyPhraseFromText(`

It was popularised in the 1960s!

  `)
  ).toStrictEqual('It was popularised in the 1960s')
})
test('getKeyPhraseFromText.end-of-the-line-without-punctuaion', () => {
  expect(
    getKeyPhraseFromText(`Try it out for yourself! Donald Duck`)
  ).toStrictEqual('Donald Duck')
})
test('getKeyPhraseFromText.single-sentence', () => {
  expect(getKeyPhraseFromText('This is a rich text')).toStrictEqual(
    'This is a rich text'
  )
})
