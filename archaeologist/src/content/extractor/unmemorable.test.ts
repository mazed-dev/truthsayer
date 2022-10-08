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
    'https://mazed.com/search=',
    'https://mazed.dev',
    'https://mazed.se/',
    'https://mazed.app/',
    'http://about:devtools-toolbox?id=0b1e6917bec8bc1aa8c2131e8fba56e1131aa82c%40temporary-addon&type=extension',
    'about:preferences',
    'chrome://about',
    'edge://extensions',
  ].forEach((url: string) => {
    expect(isMemorable(url)).toStrictEqual(false)
  })
})
