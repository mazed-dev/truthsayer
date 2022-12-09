import { isPageWriteAugmentable } from './augmentable'

test('isPageWriteAugmentable.blocked', () => {
  ;[
    'https://akindyakov.sharepoint.com/personal/abc/abc',
    'https://docs.google.com/spreadsheets/d/1SMWfn5LPtzXc4j5hRrKdkxladBHY/edit',
  ].forEach((url) => {
    expect(isPageWriteAugmentable(url)).toStrictEqual(false)
  })
})

test('isPageWriteAugmentable.allowed', () => {
  ;['https://youtube.com/', 'https://stackoverflow.com/index.html'].forEach(
    (url) => {
      expect(isPageWriteAugmentable(url)).toStrictEqual(true)
    }
  )
})
