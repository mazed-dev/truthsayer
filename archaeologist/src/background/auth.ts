import * as badge from './../badge/badge'
import browser from 'webextension-polyfill'
import { Knocker, authCookie } from 'smuggler-api'
import { log, isAbortError } from 'armoury'

// Periodically renew auth token using Knocker
// Time period in milliseonds (~17 minutes) is a magic prime number to avoid too
// many weird correlations with running Knocker in web app.
const _authKnocker = new Knocker(undefined, async () => {
  try {
    await browser.cookies.remove({
      url: authCookie.url,
      name: authCookie.name,
    })
  } catch (err) {
    if (!isAbortError(err)) {
      log.exception(err)
    }
  }
})

const onChangedCookiesListener = async (
  info: browser.Cookies.OnChangedChangeInfoType
) => {
  const { value, name, domain } = info.cookie
  if (domain === authCookie.domain && name === authCookie.name) {
    const status = authCookie.checkRawValue(value || null)
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
      name: authCookie.name,
    })
    return authCookie.checkRawValue(cookie?.value || null)
  } catch (err) {
    if (!isAbortError(err)) {
      log.exception(err)
    }
  }
  return false
}

export function register() {
  _authKnocker.start()
  if (!browser.cookies.onChanged.hasListener(onChangedCookiesListener)) {
    browser.cookies.onChanged.addListener(onChangedCookiesListener)
  }
  return () => {
    browser.cookies.onChanged.removeListener(onChangedCookiesListener)
    _authKnocker.abort()
  }
}
