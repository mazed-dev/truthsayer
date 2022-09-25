import {
  _isArticleUrl,
  _isManuallyAllowed,
  _isManuallyBlocked,
} from './autosaveable'

test('Autosaveable.homepage', () => {
  ;[
    'https://stackoverflow.com/',
    'https://youtube.com/',
    'https://stackoverflow.com/index.html',
  ].forEach((url) => {
    expect(_isArticleUrl(new URL(url))).toStrictEqual(false)
  })
  expect(
    _isArticleUrl(new URL('https://akindyakov.dev/routine-and-recipes/'))
  ).toStrictEqual(true)
})
test('Autosaveable.manually-blocked', () => {
  ;[
    'https://docs.google.com/document/d/45W',
    'https://github.com/Thread-knowledge/truthsayer/pull/241/commits',
    'https://abc.com/forgot/signin',
    'https://abc.com/SIGNUP',
    'https://abc.com/forgot/signup/',
    'https://abc.com/forgot/login/abc',
    'https://abc.com/forgot/Login',
    'https://abc.com/forgot/LogIn',
    'https://roamresearch.com/#/signin',
    'https://eventbrite.co.uk/signin/signup/?referrer=abc',
    'https://zoom.us/oauth/signin?_rnd=166',
    'https://zoom.us/oauth/signin/?_rnd=166',
  ].forEach((url) => {
    expect(_isManuallyBlocked(url)).toStrictEqual(true)
  })
  ;['https://github.com/Thread-knowledge/truthsayer/pull/241'].forEach(
    (url) => {
      expect(_isManuallyBlocked(url)).toStrictEqual(false)
    }
  )
})
test('Autosaveable.manually-allowed', () => {
  ;[].forEach((url) => {
    expect(_isManuallyAllowed(url)).toStrictEqual(true)
  })
})
