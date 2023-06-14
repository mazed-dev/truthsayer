import { guessBrowserNameByUserAgentString } from './browser'

describe('guessBrowserNameByUserAgentString', () => {
  it('Mozilla Firefox', () => {
    expect(
      guessBrowserNameByUserAgentString(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:87.0) Gecko/20100101 Firefox/87.0'
      )
    ).toEqual('Mozilla Firefox')
  })

  it('Opera', () => {
    expect(
      guessBrowserNameByUserAgentString(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.72 Safari/537.36 OPR/76.0.4017.177'
      )
    ).toEqual('Opera')
  })

  it('Microsoft Internet Explorer', () => {
    expect(
      guessBrowserNameByUserAgentString(
        'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; AS; rv:11.0) like Gecko'
      )
    ).toEqual('Microsoft Internet Explorer')
  })

  it('Microsoft Edge', () => {
    expect(
      guessBrowserNameByUserAgentString(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36 Edg/89.0.774.54'
      )
    ).toEqual('Microsoft Edge')
  })

  it('Google Chrome or Chromium', () => {
    expect(
      guessBrowserNameByUserAgentString(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36'
      )
    ).toEqual('Google Chrome')
  })
})
