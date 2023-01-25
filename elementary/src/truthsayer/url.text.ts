import { truthsayer } from './url'

describe('test suite for makeUrl', () => {
  const SAVED_ENV = process.env
  beforeEach(() => {
    process.env = { ...SAVED_ENV } // Make a copy
  })
  afterAll(() => {
    process.env = SAVED_ENV // Restore old environment
  })

  test('makeSearchUrl', () => {
    const apiUrl = 'https://abc.mazed.se'
    process.env.REACT_APP_TRUTHSAYER_URL = apiUrl
    expect(truthsayer.url.makeSearch('fancy').toString()).toStrictEqual(
      'https://abc.mazed.se/search?q=fancy'
    )
    expect(truthsayer.url.makeSearch('Fancy cuppa').toString()).toStrictEqual(
      'https://abc.mazed.se/search?q=Fancy+cuppa'
    )
  })
})
