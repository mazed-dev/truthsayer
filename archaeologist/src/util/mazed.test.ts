import { mazed } from './mazed'

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
    process.env.REACT_APP_SMUGGLER_API_URL = apiUrl
    expect(mazed.makeSearchUrl('fancy').toString()).toStrictEqual(
      'https://abc.mazed.se/search?q=fancy'
    )
    expect(mazed.makeSearchUrl('Fancy cuppa').toString()).toStrictEqual(
      'https://abc.mazed.se/search?q=Fancy+cuppa'
    )
  })
})
