import { _matchesPattern, _extattrsMatchesPattern } from './search'

test('_matchesPattern', () => {
  expect(_matchesPattern(/.*/, null)).toStrictEqual(false)
  expect(_matchesPattern(/.*/, undefined)).toStrictEqual(false)

  expect(_matchesPattern(/.*/, '')).toStrictEqual(true)

  expect(_matchesPattern(/abc/, '--abc--')).toStrictEqual(true)
  expect(_matchesPattern(/aBc/, 'aBc--')).toStrictEqual(true)
  expect(_matchesPattern(/aBc/, '--aBc')).toStrictEqual(true)
})

test('_extattrsMatchesPattern', () => {
  expect(
    _extattrsMatchesPattern(/png/, {
      content_type: 'image/jpg',
      title: null,
      description: null,
      lang: null,
      author: null,
      preview_image: null,
      web: null,
      blob: null,
    })
  ).toStrictEqual(false)

  expect(
    _extattrsMatchesPattern(/en/, {
      content_type: 'image/jpg',
      title: null,
      description: null,
      lang: 'en',
      author: null,
      preview_image: null,
      web: null,
      blob: null,
    })
  ).toStrictEqual(true)

  expect(
    _extattrsMatchesPattern(/Dickens/, {
      content_type: 'image/jpg',
      title: null,
      description: null,
      lang: null,
      author: 'by Charles Dickens',
      preview_image: null,
      web: null,
      blob: null,
    })
  ).toStrictEqual(true)

  expect(
    _extattrsMatchesPattern(/twist/i, {
      content_type: 'image/jpg',
      title: 'Oliver Twist',
      description: null,
      lang: null,
      author: null,
      preview_image: null,
      web: null,
      blob: null,
    })
  ).toStrictEqual(true)

  expect(
    _extattrsMatchesPattern(/orphan/i, {
      content_type: 'image/jpg',
      title: 'Oliver Twist',
      description: '...Born in a workhouse, the orphan...',
      lang: null,
      author: null,
      preview_image: null,
      web: null,
      blob: null,
    })
  ).toStrictEqual(true)

  // Search by mime type
  expect(
    _extattrsMatchesPattern(/image/, {
      content_type: 'image/jpg',
      title: null,
      description: null,
      lang: null,
      author: null,
      preview_image: null,
      web: null,
      blob: null,
    })
  ).toStrictEqual(true)
})
