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
    // Settings page of https://addons.mozilla.org/en-GB/firefox/addon/adblocker-ultimate/
    'moz-extension://6f647dcf-6e93-49e3-9348-c0f11044db6c/pages/options.html',
    // Settings page of https://microsoftedge.microsoft.com/addons/detail/adblock-plus-free-ad-bl/gmgoamodcdcjnbaobigkjelfplakmdhh
    'extension://gmgoamodcdcjnbaobigkjelfplakmdhh/options.html',
    'http://about:devtools-toolbox?id=0b1e6917bec8bc1aa8c2131e8fba56e1131aa82c%40temporary-addon&type=extension',
    'about:preferences', // Firefox settings
    'chrome://about',
    'edge://extensions',
  ].forEach((url: string) => {
    expect(isMemorable(url)).toStrictEqual(false)
  })
})
