import { genOriginId } from './originId'

import { urls } from './originId.test.data.json'

test('Case does not mater', async () => {
  const url = 'https://Load.IO/c/k'
  expect(await genOriginId(url)).toStrictEqual(
    await genOriginId(url.toLowerCase())
  )
  expect(await genOriginId(url)).toStrictEqual(
    await genOriginId(url.toUpperCase())
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
  const ids = await Promise.all(urls.map(async (url) => await genOriginId(url)))
  expect(urls.length).toStrictEqual(ids.length)
})
