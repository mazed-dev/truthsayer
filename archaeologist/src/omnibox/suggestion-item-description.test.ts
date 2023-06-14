// @ts-ignore: Do not remove this import, it's somewhat needed for jsdom
import type React from 'react' // eslint-disable-line @typescript-eslint/no-unused-vars
/**
 * @jest-environment jsdom
 */
import jsdom from 'jsdom'

import { formatDescription } from './suggestion-item-description'

const { JSDOM } = jsdom

describe('test suite for makeUrl', () => {
  const SAVED_ENV = process.env

  beforeEach(() => {
    process.env = { ...SAVED_ENV } // Make a copy
  })

  afterAll(() => {
    process.env = SAVED_ENV // Restore old environment
  })

  test('_formatDescription - valid XML in output', () => {
    process.env.CHROMIUM = 'true'
    const rooted = (xml: string) => `<root>${xml}</root>`
    const assertXml = (xml: string) => {
      // Test if any XML tags are added at all
      expect(xml.search(/<\w+>/)).toBeGreaterThanOrEqual(0)
      // Throws an exception on invalid XML
      new JSDOM(rooted(xml), {
        contentType: 'text/xml',
      })
    }
    assertXml(formatDescription('…'))
    assertXml(formatDescription('"…"'))
    assertXml(formatDescription('a'))
    assertXml(formatDescription('a', 'https://abc.es'))
    assertXml(formatDescription('""', 'https://abc.es'))
    assertXml(formatDescription('a > b', 'https://abc.es'))
  })

  test('_formatDescription - no XML in output for Firefox', () => {
    process.env.CHROMIUM = undefined
    expect(formatDescription('a')).toStrictEqual('a')
    expect(
      formatDescription('a', 'https://abc.es').search(/<\w+>/)
    ).toStrictEqual(-1)
  })
})
