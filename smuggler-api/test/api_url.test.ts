import { makeUrl } from '../src/api_url.js'

describe('test suite for makeUrl', () => {
  const SAVED_ENV = process.env

  beforeEach(() => {
    process.env = { ...SAVED_ENV } // Make a copy
  })

  afterAll(() => {
    process.env = SAVED_ENV // Restore old environment
  })

  test('API_URL is undefined', () => {
    expect(makeUrl()).toStrictEqual('/')
  })

  test('API_URL is absolute url', () => {
    const apiUrl = 'https://abc.mazed.dev'
    process.env.REACT_APP_SMUGGLER_API_URL = apiUrl
    expect(makeUrl()).toStrictEqual(`${apiUrl}/`)
    expect(makeUrl('node')).toStrictEqual(`${apiUrl}/node`)
    expect(makeUrl('node/')).toStrictEqual(`${apiUrl}/node`)
    expect(makeUrl('/node/')).toStrictEqual(`${apiUrl}/node`)
    expect(makeUrl('node/abc')).toStrictEqual(`${apiUrl}/node/abc`)
    expect(makeUrl('node/abc', { abc: 12 })).toStrictEqual(
      `${apiUrl}/node/abc?abc=12`
    )
  })

  test('API_URL is local path', () => {
    const apiUrl = '/abc/dev'
    process.env.REACT_APP_SMUGGLER_API_URL = apiUrl
    expect(makeUrl()).toStrictEqual(`${apiUrl}/`)
    expect(makeUrl('node')).toStrictEqual(`${apiUrl}/node`)
  })

  test('Multikeys in query', () => {
    const apiUrl = 'https://mazed.dev'
    process.env.REACT_APP_SMUGGLER_API_URL = apiUrl
    expect(
      makeUrl('/abc', {
        from: ['0fd5', '5fcb'],
        to: ['0542', '4ac4', 'a720'],
      })
    ).toStrictEqual(
      'https://mazed.dev/abc?from=0fd5&from=5fcb&to=0542&to=4ac4&to=a720'
    )
  })
})
