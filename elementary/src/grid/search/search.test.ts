import { _matchesPattern, _extattrsMatchesPattern, Beagle } from './search'

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
    })
  ).toStrictEqual(false)

  expect(
    _extattrsMatchesPattern(/en/, {
      content_type: 'image/jpg',
      lang: 'en',
    })
  ).toStrictEqual(true)

  expect(
    _extattrsMatchesPattern(/Dickens/, {
      content_type: 'image/jpg',
      author: 'by Charles Dickens',
    })
  ).toStrictEqual(true)

  expect(
    _extattrsMatchesPattern(/twist/i, {
      content_type: 'image/jpg',
      title: 'Oliver Twist',
    })
  ).toStrictEqual(true)

  expect(
    _extattrsMatchesPattern(/orphan/i, {
      content_type: 'image/jpg',
      title: 'Oliver Twist',
      description: '...Born in a workhouse, the orphan...',
    })
  ).toStrictEqual(true)

  // Search by mime type
  expect(
    _extattrsMatchesPattern(/image/, {
      content_type: 'image/jpg',
    })
  ).toStrictEqual(true)
})

test('Beagle.fromString', () => {
  const beagle = Beagle.fromString('Oxygen "font family"')
  expect(beagle.all).toStrictEqual([
    /font family/,
    /oxygen/i,
  ])
})
