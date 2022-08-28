import Cookies from 'universal-cookie'

export const COOKIES_VEIL_KEY: string = 'x-magic-veil'

function checkRawValue(value: string | null) {
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
  check() {
    // Is it too slow?
    const cookies = new Cookies()
    return checkRawValue(cookies.get(COOKIES_VEIL_KEY))
  },
  drop() {
    const cookies = new Cookies()
    cookies.remove(COOKIES_VEIL_KEY)
  },
  url: process.env.REACT_APP_SMUGGLER_API_URL || '',
  domain: getAuthCookieDomain(),
  name: COOKIES_VEIL_KEY,
  checkRawValue,
}
