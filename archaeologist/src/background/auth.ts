import * as badge from './../badge/badge'
import browser from 'webextension-polyfill'
import {
  AccountInterface,
  AnonymousAccount,
  SmugglerTokenLastUpdateCookies,
  UserAccount,
} from 'smuggler-api'
import { Knocker, authCookie } from 'smuggler-api'
import { log, isAbortError, errorise } from 'armoury'
import { v4 as uuidv4 } from 'uuid'

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
const _listeners: Map<
  string /*listener ID*/,
  {
    // External listener for login events
    onLogin: (account: UserAccount) => void
    // External listener for logout events
    onLogout: () => void
  }
> = new Map()

function _onLogin(account: UserAccount) {
  for (const [_, { onLogin }] of _listeners) {
    try {
      onLogin(account)
    } catch (reason) {
      log.error(`onLogin listener failed: ${errorise(reason).message}`)
    }
  }
}

function _onLogout() {
  for (const [_, { onLogout }] of _listeners) {
    try {
      onLogout()
    } catch (reason) {
      log.error(`onLogin listener failed: ${errorise(reason).message}`)
    }
  }
}

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

// Internal actions to do on login event
async function _loginHandler() {
  _account = await createUserAccount()
  if (isAuthenticated(_account)) {
    if (!_authKnocker.isActive()) {
      await _authKnocker.start({ onKnockFailure })
    }
    _onLogin(_account)
  }
  await badge.setActive(_account.isAuthenticated())
}

// Internal actions to do on logout event
async function _logoutHandler() {
  _account = new AnonymousAccount()
  await _authKnocker.abort()
  await badge.setActive(false)
  _onLogout()
}

// Actions to do on authorisation token renewal failure (knock of Knocker)
async function onKnockFailure() {
  await _logoutHandler()
  if (isAuthenticated(_account)) {
    throw new Error(
      'Failed to logout. Authorisation-related issues are likely. ' +
        `Result = ${JSON.stringify(_account)}`
    )
  }
}

// Listen to a change in Mazed authorisation cookie and login/logout accordingly
const onChangedCookiesListener = async (
  info: browser.Cookies.OnChangedChangeInfoType
) => {
  const { value, name, domain } = info.cookie
  if (domain === authCookie.domain && name === authCookie.veil.name) {
    const status = authCookie.veil.parse(value || null)
    if (status) {
      await _loginHandler()
    } else {
      await _logoutHandler()
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
  const listenerId = uuidv4()
  _listeners.set(listenerId, { onLogin, onLogout })

  const unregister = () => {
    _listeners.delete(listenerId)
  }

  try {
    if (isAuthenticated(_account)) {
      onLogin(_account)
    }
  } catch (e) {
    unregister()
    throw e
  }

  return unregister
}

/**
 * This is a module to maintain Archaeologist authorisation with Smuggler
 *
 *- Knocker must be created on each successful login.
 *- Knocker role is to renew auth token after successful login periodically.
 *- It stops after a first renewal failure.
 *- Archaeologist listens to a change in authorisation via cookie listener, it
 *  performs for auth status:
 *  - Initialisation with `_loginHandler` when cookie `x-magic-veil:y` is added;
 *  - De-initialisation when this cookie is deleted with `_logoutHander`.
 */
export async function register() {
  log.debug('Authorisation module is registered')
  await _loginHandler()
  if (!browser.cookies.onChanged.hasListener(onChangedCookiesListener)) {
    browser.cookies.onChanged.addListener(onChangedCookiesListener)
  }
  return async () => {
    browser.cookies.onChanged.removeListener(onChangedCookiesListener)
    await _logoutHandler()
    try {
      _onLogout()
    } finally {
      _listeners.clear()
    }
  }
}
