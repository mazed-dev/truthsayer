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
  expect(_isArticleUrl(new URL('https://translate.google.com/'))).toStrictEqual(
    false
  )
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
    // Archaeologist can't extract text from google docs yet, autosaving doesn't
    // work well without it.
    'https://docs.google.com/document/d/45W',
    'https://docs.google.com/spreadsheets/d/1P9oEq-Bl',
  ].forEach((url) => {
    expect(_isManuallyAllowed(url)).toStrictEqual(false)
  })
})
test('unreadable.manually-allowed', () => {
  ;[].forEach((url) => {
    expect(_isManuallyAllowed(url)).toStrictEqual(true)
  })
})
