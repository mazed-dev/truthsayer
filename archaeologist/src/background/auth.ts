import * as badge from './../badge/badge'
import browser from 'webextension-polyfill'
import type { SmugglerTokenLastUpdateCookies } from 'smuggler-api'
import { Knocker, authCookie } from 'smuggler-api'
import { log, isAbortError } from 'armoury'

// Periodically renew auth token using Knocker
const _authKnocker = new Knocker(
  async () => {
    try {
      await browser.cookies.remove({
        url: authCookie.url,
        name: authCookie.veil.name,
      })
    } catch (err) {
      if (!isAbortError(err)) {
        log.exception(err)
      }
    }
  },
  async () => {
    const {
      url,
      lastUpdate: { name },
    } = authCookie
    const cookie = await browser.cookies.get({ url, name })
    if (cookie == null) {
      return undefined
    }
    try {
      const value = JSON.parse(decodeURIComponent(cookie.value))
      if (value != null) {
        return value as SmugglerTokenLastUpdateCookies
      }
    } catch (err) {
      log.debug(
        'Corrupted smuggler auth token last update info in cookies',
        err
      )
      return undefined
    }
    return undefined
  },
  async (value: SmugglerTokenLastUpdateCookies) => {
    const {
      url,
      lastUpdate: { name },
    } = authCookie
    await browser.cookies.set({
      url,
      name,
      value: encodeURIComponent(JSON.stringify(value)),
    })
  }
)

const onChangedCookiesListener = async (
  info: browser.Cookies.OnChangedChangeInfoType
) => {
  const { value, name, domain } = info.cookie
  if (domain === authCookie.domain && name === authCookie.veil.name) {
    const status = authCookie.veil.parse(value || null)
    await badge.setActive(status)
    if (status) {
      _authKnocker.start()
    } else {
      _authKnocker.abort()
    }
  }
}

export async function isAuthorised(): Promise<boolean> {
  try {
    const cookie = await browser.cookies.get({
      url: authCookie.url,
      name: authCookie.veil.name,
    })
    return authCookie.veil.parse(cookie?.value || null)
  } catch (err) {
    if (!isAbortError(err)) {
      log.exception(err)
    }
  }
  return false
}

export async function register() {
  _authKnocker.start()
  if (!browser.cookies.onChanged.hasListener(onChangedCookiesListener)) {
    browser.cookies.onChanged.addListener(onChangedCookiesListener)
  }
  await badge.setActive(await isAuthorised())
  return () => {
    browser.cookies.onChanged.removeListener(onChangedCookiesListener)
    _authKnocker.abort()
  }
}
