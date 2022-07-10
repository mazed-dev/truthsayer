import { _isArticleUrl } from './unreadable'

test('unreadable.homepage', () => {
  expect(_isArticleUrl(new URL('https://stackoverflow.com/'))).toStrictEqual(
    false
  )
  expect(_isArticleUrl(new URL('https://youtube.com/'))).toStrictEqual(false)
  expect(
    _isArticleUrl(new URL('https://stackoverflow.com/index.html'))
  ).toStrictEqual(false)
  expect(
    _isArticleUrl(new URL('https://stackoverflow.com/index.php'))
  ).toStrictEqual(false)
  expect(
    _isArticleUrl(new URL('https://akindyakov.dev/routine-and-recipes/'))
  ).toStrictEqual(true)
})

test('unreadable.tools', () => {
  expect(
    _isArticleUrl(
      new URL(
        'https://translate.google.com/?sl=en&tl=ru&text=text&op=translate'
      )
    )
  ).toStrictEqual(false)
})
