import { _isArticleUrl, _isManuallyAllowed } from './unreadable'

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
test('unreadable.manually-default', () => {
  ;[
    'https://irs.gov/individuals/international-taxpayers/claiming-tax-treaty-benefits',
  ].forEach((url) => {
    expect(_isManuallyAllowed(url)).toStrictEqual(true)
  })
})
test('unreadable.manually-blocked', () => {
  ;[
    'https://keep.google.com/u/0/',
    'https://keep.google.com/u/1/',
    'https://keep.google.com/u/0/#home',
    'https://keep.google.com/u/2/#home',
  ].forEach((url) => {
    expect(_isManuallyAllowed(url)).toStrictEqual(false)
  })
})
test('unreadable.manually-allowed', () => {
  ;[
    'https://keep.google.com/u/0/#NOTE/RVAk4qmHZLuUvgIYV',
    'https://keep.google.com/u/0/#note/RVAk4qmHZLuUvgIYV',
  ].forEach((url) => {
    expect(_isManuallyAllowed(url)).toStrictEqual(true)
  })
})
