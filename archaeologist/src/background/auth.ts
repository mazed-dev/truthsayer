import * as badge from './../badge/badge'
import browser from 'webextension-polyfill'
import {
  AccountInterface,
  AnonymousAccount,
  SmugglerTokenLastUpdateCookies,
  UserAccount,
} from 'smuggler-api'
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

let _account: AccountInterface = new AnonymousAccount()
let _onLogin: ((account: UserAccount) => void) | null = null
let _onLogout: (() => void) | null = null

function isAuthenticated(account: AccountInterface): account is UserAccount {
  return account.isAuthenticated()
}

// TODO[snikitin@outlook.com] this is a background-compatible
// version of smuggler-api.createUserAccount. Can/should they be merged?
export async function createUserAccount(
  abortSignal?: AbortSignal
): Promise<AccountInterface> {
  const veil = await browser.cookies.get({
    url: process.env.REACT_APP_SMUGGLER_API_URL || '',
    name: authCookie.veil.name,
  })
  if (veil != null && !authCookie.veil.parse(veil.value)) {
    return new AnonymousAccount()
  }
  return UserAccount.create(abortSignal)
}

async function onKnockSuccess() {
  log.debug('Knock success')
  if (isAuthenticated(_account)) {
    return
  }
  _account = await createUserAccount()
  if (!isAuthenticated(_account)) {
    throw new Error(
      'Tried to create a UserAccount on auth knock success, but failed. ' +
        'Authorisation-related issues are likely. ' +
        `Result = ${JSON.stringify(_account)}`
    )
  }
  if (_onLogin) {
    _onLogin(_account)
  }
}

function onKnockFailure() {
  log.debug('Knock failure')
  _account = new AnonymousAccount()
  if (_onLogout) {
    _onLogout()
  }
}

const onChangedCookiesListener = async (
  info: browser.Cookies.OnChangedChangeInfoType
) => {
  const { value, name, domain } = info.cookie
  if (domain === authCookie.domain && name === authCookie.veil.name) {
    const status = authCookie.veil.parse(value || null)
    await badge.setActive(status)
    if (status) {
      await _authKnocker.start({
        onKnockSuccess,
        onKnockFailure,
      })
    } else {
      await _authKnocker.abort()
    }
  }
}

export function account(): AccountInterface {
  return _account
}

/**
 * Observe authentication status via a callback that will be invoked when
 * a user logs in and a callback invoked when a user logs out.
 *
 * If a user logged in already at the time the call of 'observe',
 * 'onLogin' will be invoked immediately.
 *
 * Returns a functor that once invoked unregisters callbacks supplied to
 * 'observe'.
 */
export function observe({
  onLogin,
  onLogout,
}: {
  onLogin: (account: UserAccount) => void
  onLogout: () => void
}): () => void {
  if (_onLogin != null || _onLogout != null) {
    throw new Error(
      'Background authentication is already being observed, ' +
        'to observe from multiple places the functionality has to be extended'
    )
  }
  _onLogin = onLogin
  _onLogout = onLogout

  const unregister = () => {
    _onLogin = null
    _onLogout = null
  }

  try {
    if (isAuthenticated(_account)) {
      _onLogin(_account)
    }
  } catch (e) {
    unregister()
    throw e
  }

  return unregister
}

export async function register() {
  _account = await createUserAccount()
  _authKnocker.start({
    onKnockSuccess,
    onKnockFailure,
  })
  if (!browser.cookies.onChanged.hasListener(onChangedCookiesListener)) {
    browser.cookies.onChanged.addListener(onChangedCookiesListener)
  }
  await badge.setActive(_account.isAuthenticated())
  return async () => {
    browser.cookies.onChanged.removeListener(onChangedCookiesListener)
    await _authKnocker.abort()
    _account = new AnonymousAccount()
    try {
      if (_onLogout) {
        _onLogout()
      }
    } finally {
      _onLogin = null
      _onLogout = null
    }
  }
}
