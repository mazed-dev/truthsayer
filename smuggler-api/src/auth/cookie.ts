import Cookies from 'universal-cookie'

import { log, isAbortError } from 'armoury'

export const COOKIES_VEIL_KEY: string = 'x-magic-veil'
export const COOKIES_LAST_UPDATE_KEY: string =
  'x-magic-smuggler-token-last-update'

export type SmugglerTokenLastUpdateCookies = {
  // unixtime
  time: number
}

function parseVeilRawValue(value: string | null) {
  return value === 'y'
}

function getAuthCookieDomain(): string {
  if (typeof window !== 'undefined' && window && window.location.hostname) {
    return window.location.hostname
  } else if (process.env.REACT_APP_SMUGGLER_API_URL) {
    // Excption for browser extension background script, which does not have an
    // access to a window var or any active tab of Truthsayer. Instead browser
    // extension code uses special env var to specify full URL to smuggler API.
    const url = new URL(process.env.REACT_APP_SMUGGLER_API_URL)
    return url?.hostname
  }
  return ''
}

export const authCookie = {
  url: process.env.REACT_APP_SMUGGLER_API_URL || '',
  domain: getAuthCookieDomain(),
  veil: {
    name: COOKIES_VEIL_KEY,
    parse: parseVeilRawValue,
    check: () => {
      // Is it too slow?
      const cookies = new Cookies()
      return parseVeilRawValue(cookies.get<string>(COOKIES_VEIL_KEY))
    },
    drop: () => {
      const cookies = new Cookies()
      cookies.remove(COOKIES_VEIL_KEY)
    },
  },
  lastUpdate: {
    name: COOKIES_LAST_UPDATE_KEY,
    get: async (): Promise<SmugglerTokenLastUpdateCookies | undefined> => {
      const cookies = new Cookies()
      try {
        return cookies.get<SmugglerTokenLastUpdateCookies>(
          COOKIES_LAST_UPDATE_KEY
        )
      } catch (err) {
        log.debug(
          'Corrupted smuggler auth token last update info in cookies',
          err
        )
      }
      return undefined
    },
    set: async (value: SmugglerTokenLastUpdateCookies): Promise<void> => {
      const cookies = new Cookies()
      return cookies.set(COOKIES_LAST_UPDATE_KEY, value)
    },
  },
}
