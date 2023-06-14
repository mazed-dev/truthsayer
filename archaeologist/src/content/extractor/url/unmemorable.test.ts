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
    'https://us06web.zoom.us/j/7341671219?pwd=QWU5aUNHTDlVenNQZE9iYjh1V3F2dz09',
  ].forEach((url: string) => {
    expect(isMemorable(url)).toStrictEqual(false)
  })
})
