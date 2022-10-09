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
    'https://meet.google.com/nwx-tzrk-nkt',
    'https://mazed.com/search=',
    'https://mazed.dev',
    'https://mazed.se/',
    'https://mazed.app/',
    'https://us06web.zoom.us/j/7341671219?pwd=QWU5aUNHTDlVenNQZE9iYjh1V3F2dz09',
  ].forEach((url: string) => {
    expect(isMemorable(url)).toStrictEqual(false)
  })
})
