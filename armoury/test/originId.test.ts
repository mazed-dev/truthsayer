import {
  genOriginId,
  stabiliseUrlForOriginId,
  _uint32ToInt32,
} from '../src/originId'

import { urls } from './originId.test.data.json'

test('Case does mater for everything after domain name', () => {
  expect(genOriginId('https://Load.IO/c/k?q=qWeRtY')).toStrictEqual(
    genOriginId('https://load.io/c/k?q=qWeRtY')
  )
  expect(
    genOriginId('https://High.Load.IO/En/Dry?q=qWeRtY&Promise=None')
  ).toStrictEqual(
    genOriginId('https://high.load.io/En/Dry?q=qWeRtY&Promise=None')
  )
})

test('Scheme does not mater', () => {
  const https = 'https://abc.abc/abc'
  const http = 'http://abc.abc/abc'
  const none = 'abc.abc/abc'
  expect(genOriginId(https)).toStrictEqual(genOriginId(http))
  expect(genOriginId(none)).toStrictEqual(genOriginId(http))
})

test('WWW is stripped', () => {
  const url = 'https://www.abc.abc/abc'
  const www = 'https://abc.abc/abc'
  expect(genOriginId(url)).toStrictEqual(genOriginId(www))
})

test('Trailing does not mater', () => {
  const url1 = 'https://abc.abc/abc/'
  const url2 = 'https://abc.abc/abc'
  expect(genOriginId(url1)).toStrictEqual(genOriginId(url2))
})

test('Authentication does not mater', () => {
  const auth = 'user:password@sindresorhus.com'
  const url = 'https://sindresorhus.com'
  expect(genOriginId(url)).toStrictEqual(genOriginId(auth))
})

test('Fragment does not mater', () => {
  const urlWithRef = 'https://abc.abc/abc#asdf'
  const urlWithout = 'https://abc.abc/abc'
  expect(genOriginId(urlWithout)).toStrictEqual(genOriginId(urlWithRef))
})

test('Query is always normalized', () => {
  const url1 = 'https://abc.abc/abc?x=qwerty&a=1&b=w3'
  const url2 = 'https://abc.abc/abc?b=w3&x=qwerty&a=1'
  expect(genOriginId(url1)).toStrictEqual(genOriginId(url2))
})

test('Collisions', () => {
  const ids = urls.map((url: string) => {
    const { id } = genOriginId(url)
    return id
  })
  expect(urls.length).toStrictEqual(ids.length)
})

test('Stability', () => {
  const fixtures = {
    'https://emotion.sh/docs/styled': -1747687538,
    'https://github.com/emotion-js/emotion': 209096158,
    'https://developer.mozilla.org/': 959490071,
    'https://stackoverflow.com/': 2109468316,
    'https://yarnpkg.com/': 1988484847,
  }
  for (const [url, expectedId] of Object.entries(fixtures)) {
    const { id } = genOriginId(url)
    expect(id).toStrictEqual(expectedId)
  }
})

test('u32ToI32', () => {
  expect(_uint32ToInt32(0)).toStrictEqual(0)
  expect(_uint32ToInt32(1)).toStrictEqual(1)
  expect(_uint32ToInt32(0x7fffffff)).toStrictEqual(0x7fffffff)
  expect(_uint32ToInt32(0x7fffffff + 1)).toStrictEqual(-2147483648)
  expect(_uint32ToInt32(0xffffffff)).toStrictEqual(-1)

  expect(_uint32ToInt32(-1)).toStrictEqual(-1)
})

test('stabiliseUrlForOriginId', () => {
  expect(stabiliseUrlForOriginId('https://simonwillison.net/')).toStrictEqual(
    'https://simonwillison.net'
  )
})
test('stabiliseUrlForOriginId - utm_ query parameters are removed', () => {
  // All utm's query parameters are removed
  expect(
    stabiliseUrlForOriginId(
      'https://simonwillison.net/2022/Jul/9/gpt-3-explain-code/?utm_source=pocket_mylist'
    )
  ).toStrictEqual('https://simonwillison.net/2022/Jul/9/gpt-3-explain-code')
  expect(
    stabiliseUrlForOriginId(
      'https://simonwillison.net/2022/Jul/9/gpt-3-explain-code/?utm_source=pocket_mylist&utm_medium=email'
    )
  ).toStrictEqual('https://simonwillison.net/2022/Jul/9/gpt-3-explain-code')
  expect(
    stabiliseUrlForOriginId(
      'https://simonwillison.net/2022/Jul/9/gpt-3-explain-code/?utm_medium=email&utm_campaign=summer-sale&utm_term=gpt-3&utm_content=abc'
    )
  ).toStrictEqual('https://simonwillison.net/2022/Jul/9/gpt-3-explain-code')
})

test('stabiliseUrlForOriginId - ref_src/ref_url are removed', () => {
  expect(
    stabiliseUrlForOriginId(
      'https://jul.com/code/?ref_src=email&ref_url=abc.com'
    )
  ).toStrictEqual('https://jul.com/code')
})

test('stabiliseUrlForOriginId - itm_ query parameters are removed', () => {
  // All itm's query parameters are removed
  expect(
    stabiliseUrlForOriginId(
      'https://simonwillison.net/2022/Jul/9/gpt-3-explain-code/?itm_source=pocket_mylist'
    )
  ).toStrictEqual('https://simonwillison.net/2022/Jul/9/gpt-3-explain-code')
})

test('stabiliseUrlForOriginId - query parameters are preserved', () => {
  // All other keys are preserved as they are
  ;[
    'https://google.com/search?newwindow=1&q=ts&sxsrf=ALiCzsYnB6rzki&utmost=yes',
  ].forEach((url) => {
    expect(stabiliseUrlForOriginId(url)).toStrictEqual(url)
  })
})
