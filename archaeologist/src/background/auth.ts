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

/**
 * External listener for login events
 */
let _onLoginListener: ((account: UserAccount) => void) | null = null
/**
 * External listener for logout events
 */
let _onLogoutListener: (() => void) | null = null

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
async function _onLogin() {
  _account = await createUserAccount()
  await badge.setActive(_account.isAuthenticated())
  if (isAuthenticated(_account)) {
    if (_onLoginListener) {
      _onLoginListener(_account)
    }
  }
}

// Internal actions to do on logout event
async function _onLogout() {
  _account = new AnonymousAccount()
  await badge.setActive(false)
  if (_onLogoutListener) {
    _onLogoutListener()
  }
}

// Actions to do on __every__ successful authorisation token renewal (knock of
// Knocker)
async function onKnockSuccess() {
  log.debug('onKnockSuccess')
  if (isAuthenticated(_account)) {
    log.debug('onKnockSuccess account is created')
    return
  }
  log.debug('onKnockSuccess account is not yet created')
  await _onLogin()
  if (!isAuthenticated(_account)) {
    throw new Error(
      'Tried to create a UserAccount on auth knock success, but failed. ' +
        'Authorisation-related issues are likely. ' +
        `Result = ${JSON.stringify(_account)}`
    )
  }
}

// Actions to do on authorisation token renewal failure (knock of Knocker)
async function onKnockFailure() {
  await _onLogout()
  if (isAuthenticated(_account)) {
    throw new Error(
      'Failed to logout. Authorisation-related issues are likely. ' +
        `Result = ${JSON.stringify(_account)}`
    )
  }
}

const onChangedCookiesListener = async (
  info: browser.Cookies.OnChangedChangeInfoType
) => {
  const { value, name, domain } = info.cookie
  if (domain === authCookie.domain && name === authCookie.veil.name) {
    const status = !info.removed && authCookie.veil.parse(value || null)
    log.debug('onChangedCookiesListener - Mazed cookie', status, info)
    // await badge.setActive(status)
    if (status) {
      if (!_authKnocker.isActive()) {
        await _authKnocker.start({ onKnockSuccess, onKnockFailure })
      }
    } else {
      if (_authKnocker.isActive()) {
        await _authKnocker.abort()
      }
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
  if (_onLoginListener != null || _onLogoutListener != null) {
    throw new Error(
      'Background authentication is already being observed, ' +
        'to observe from multiple places the functionality has to be extended'
    )
  }
  _onLoginListener = onLogin
  _onLogoutListener = onLogout

  const unregister = () => {
    _onLoginListener = null
    _onLogoutListener = null
  }

  try {
    if (isAuthenticated(_account)) {
      _onLoginListener(_account)
    }
  } catch (e) {
    unregister()
    throw e
  }

  return unregister
}

export async function register() {
  log.debug('Authorisation module is registered')
  _onLogin()
  if (!browser.cookies.onChanged.hasListener(onChangedCookiesListener)) {
    browser.cookies.onChanged.addListener(onChangedCookiesListener)
  }
  return async () => {
    browser.cookies.onChanged.removeListener(onChangedCookiesListener)
    await _onLogout()
    try {
      if (_onLogoutListener) {
        _onLogoutListener()
      }
    } finally {
      _onLoginListener = null
      _onLogoutListener = null
    }
  }
}
