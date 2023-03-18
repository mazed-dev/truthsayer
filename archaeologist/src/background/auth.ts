import * as badge from './../badge/badge'
import {
  AccountInfo,
  AccountInterface,
  AnonymousAccount,
  authentication,
  SessionCreateArgs,
  SmugglerTokenLastUpdateCookies,
  UserAccount,
} from 'smuggler-api'
import { Knocker } from 'smuggler-api'
import { log, isAbortError, errorise } from 'armoury'
import { v4 as uuidv4 } from 'uuid'

const _lastUpdateTime: SmugglerTokenLastUpdateCookies = { time: 0 }
// Periodically renew auth token using Knocker
const _authKnocker = new Knocker(
  async () => {
    try {
      _logoutHandler()
    } catch (err) {
      if (!isAbortError(err)) {
        log.exception(err)
      }
    }
  },
  async (): Promise<SmugglerTokenLastUpdateCookies | undefined> => {
    return _lastUpdateTime
  },
  async (value: SmugglerTokenLastUpdateCookies) => {
    _lastUpdateTime.time = value.time
  }
)

let _account: AccountInterface = new AnonymousAccount()
const _listeners: Map<
  string /*listener ID*/,
  {
    // External listener for login events
    onLogin: (account: UserAccount) => Promise<void>
    // External listener for logout events
    onLogout: () => Promise<void>
  }
> = new Map()

async function _onLogin(account: UserAccount) {
  for (const { onLogin } of _listeners.values()) {
    try {
      await onLogin(account)
    } catch (reason) {
      log.error(`onLogin listener failed: ${errorise(reason).message}`)
    }
  }
}

async function _onLogout() {
  for (const { onLogout } of _listeners.values()) {
    try {
      await onLogout()
    } catch (reason) {
      log.error(`onLogin listener failed: ${errorise(reason).message}`)
    }
  }
}

function isAuthenticated(account: AccountInterface): account is UserAccount {
  return account.isAuthenticated()
}

// Internal actions to do on login event
async function _loginHandler(user: AccountInfo) {
  const account = new UserAccount(user.uid, user.name, user.email, {})
  _account = account

  if (!_authKnocker.isActive()) {
    await _authKnocker.start({
      /* onKnockFailure */
    })
  }
  await _onLogin(account)
  await badge.setActive(true)
}

// Internal actions to do on logout event
async function _logoutHandler() {
  _account = new AnonymousAccount()
  try {
    _authKnocker.stop()
    await badge.setActive(false)
  } finally {
    await _onLogout()
  }
}

export function account(): AccountInterface {
  return _account
}

export async function check() {
  const user = await authentication.getAuth({}).catch(() => null)
  if (user != null) {
    await _loginHandler(user)
  }
  else {
    await _logoutHandler()
  }
}

export async function login(args: SessionCreateArgs) {
  await authentication.session.create(args)
  await check()
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
  onLogin: (account: UserAccount) => Promise<void>
  onLogout: () => Promise<void>
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
 */
export async function register() {
  const user = await authentication.getAuth({}).catch(() => null)
  if (user != null) {
    await _loginHandler(user)
  }
  log.debug('Authorisation module is registered')
  return async () => {
    try {
      await _logoutHandler()
    } finally {
      _listeners.clear()
    }
  }
}
