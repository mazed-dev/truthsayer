import { genOriginId, _uint32ToInt32 } from '../src/originId'

import { urls } from './originId.test.data.json'

test('Case does mater for everything after domain name', async () => {
  expect(await genOriginId('https://Load.IO/c/k?q=qWeRtY')).toStrictEqual(
    await genOriginId('https://load.io/c/k?q=qWeRtY')
  )
  expect(
    await genOriginId('https://High.Load.IO/En/Dry?q=qWeRtY&Promise=None')
  ).toStrictEqual(
    await genOriginId('https://high.load.io/En/Dry?q=qWeRtY&Promise=None')
  )
})

test('Scheme does not mater', async () => {
  const https = 'https://abc.abc/abc'
  const http = 'http://abc.abc/abc'
  const none = 'abc.abc/abc'
  expect(await genOriginId(https)).toStrictEqual(await genOriginId(http))
  expect(await genOriginId(none)).toStrictEqual(await genOriginId(http))
})

test('WWW is stripped', async () => {
  const url = 'https://www.abc.abc/abc'
  const www = 'https://abc.abc/abc'
  expect(await genOriginId(url)).toStrictEqual(await genOriginId(www))
})

test('Trailing does not mater', async () => {
  const url1 = 'https://abc.abc/abc/'
  const url2 = 'https://abc.abc/abc'
  expect(await genOriginId(url1)).toStrictEqual(await genOriginId(url2))
})

test('Authentication does not mater', async () => {
  const auth = 'user:password@sindresorhus.com'
  const url = 'https://sindresorhus.com'
  expect(await genOriginId(url)).toStrictEqual(await genOriginId(auth))
})

test('Fragment does not mater', async () => {
  const urlWithRef = 'https://abc.abc/abc#asdf'
  const urlWithout = 'https://abc.abc/abc'
  expect(await genOriginId(urlWithout)).toStrictEqual(
    await genOriginId(urlWithRef)
  )
})

test('Query is always normalized', async () => {
  const url1 = 'https://abc.abc/abc?x=qwerty&a=1&b=w3'
  const url2 = 'https://abc.abc/abc?b=w3&x=qwerty&a=1'
  expect(await genOriginId(url1)).toStrictEqual(await genOriginId(url2))
})

test('Collisions', async () => {
  const ids = await Promise.all(
    urls.map(async (url: string) => {
      const { id } = await genOriginId(url)
      return id
    })
  )
  expect(urls.length).toStrictEqual(ids.length)
})

test('Stability', async () => {
  const fixtures = {
    'https://emotion.sh/docs/styled': -1747687538,
    'https://github.com/emotion-js/emotion': 209096158,
    'https://developer.mozilla.org/': 959490071,
    'https://stackoverflow.com/': 2109468316,
    'https://yarnpkg.com/': 1988484847,
  }
  for (const [url, expectedId] of Object.entries(fixtures)) {
    const { id } = await genOriginId(url)
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
