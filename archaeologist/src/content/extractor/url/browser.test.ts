import { isBrowserUrl } from './browser'

test('isBrowserUrl true', () => {
  ;[
    'edge://settings/',
    'edge://settings/downloads',
    'about:preferences',
    'about:about',
    'about:url-classifier',
    'about:preferences#home',
    'chrome://settings/',
    'chrome://whats-new',
    'chrome://new-tab-page-third-party',
  ].forEach((url: string) => {
    expect(isBrowserUrl(url)).toStrictEqual(true)
  })
})

test('isBrowserUrl false', () => {
  ;['https://www.theverge.com/'].forEach((url: string) => {
    expect(isBrowserUrl(url)).toStrictEqual(false)
  })
})
