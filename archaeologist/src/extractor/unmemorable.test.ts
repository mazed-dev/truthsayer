import { isMemorable } from './unmemorable'

test('isMemorable memorable', () => {
  ;['https://www.theverge.com/'].forEach((url: string) => {
    expect(isMemorable(url)).toStrictEqual(true)
  })
})

test('isMemorable unmemorable', () => {
  ;[
    'http://google.com',
    'https://google.com',
    'https://www.google.com',
    'https://google.com/search=',
  ].forEach((url: string) => {
    expect(isMemorable(url)).toStrictEqual(false)
  })
})
