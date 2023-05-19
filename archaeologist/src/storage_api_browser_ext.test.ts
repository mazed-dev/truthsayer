import { generateNid } from './storage_api_browser_ext'

describe('generateNid', () => {
  test('should generate a nid as 48-bit base64 string', () => {
    const nid = generateNid()
    expect(nid).toMatch(/^[a-z0-9+/]{4,}$/) // Match base64 format
  })

  test('should generate unique numbers', () => {
    const iterations = 1000
    const nids = new Set<string>()
    const nidsArr: string[] = []

    for (let i = 0; i < iterations; i++) {
      const nid = generateNid()
      nids.add(nid)
      nidsArr.push(nid)
    }

    const unique = Array.from(nids)
    unique.sort()
    nidsArr.sort()
    expect(nidsArr).toStrictEqual(unique)
    expect(nids.size).toBe(iterations)
  })
})
