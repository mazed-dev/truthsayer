import * as badge from './../badge/badge'
import {
  SessionCreateArgs,
  SmugglerTokenLastUpdateCookies,
  StorageApi,
  UserAccount,
  authentication,
} from 'smuggler-api'
import { Knocker } from 'smuggler-api'
import { log, isAbortError, errorise, Timer } from 'armoury'
import { v4 as uuidv4 } from 'uuid'

const _lastUpdateTime: SmugglerTokenLastUpdateCookies = { time: 0 }
// Periodically renew auth token using Knocker
const _authKnocker = new Knocker(
  async () => {
    try {
      _logoutHandler()
    } catch (e) {
      const err = errorise(e)
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

// Internal actions to do on login event
async function _loginHandler(account: UserAccount) {
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
  try {
    _authKnocker.stop()
    await badge.setActive(false)
  } finally {
    await _onLogout()
  }
}

export async function check(): Promise<void> {
  const accountInfo = await authentication.getAuth({}).catch(() => null)
  if (accountInfo != null) {
    const userAccount = new UserAccount(
      accountInfo.uid,
      accountInfo.name,
      accountInfo.email,
      {}
    )
    await _loginHandler(userAccount)
  } else {
    await _logoutHandler()
  }
}

export async function login(args: SessionCreateArgs): Promise<void> {
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
  return unregister
}

/**
 * This is a module to maintain Archaeologist authorisation with Smuggler
 *
 *- Knocker must be created on each successful login.
 *- Knocker role is to renew auth token after successful login periodically.
 *- It stops after a first renewal failure.
 */
export async function register(storage: StorageApi) {
  const timer = new Timer()
  // Additional callbacks to cache user account to local storage on every login,
  // and to reset that cache on log out.
  observe({
    onLogin: async (account: UserAccount) => {
      await storage.account.info.set({
        accountInfo: {
          uid: account.getUid(),
          email: account.getEmail(),
          name: account.getName(),
        },
      })
    },
    onLogout: async () => {
      await storage.account.info.set({})
    },
  })
  // Check the local storage for cached info about user account first to avoid
  // sending request to Smuggler risking waiting for too long or even failing
  // due to unstable connection.
  let accountInfo = await storage.account.info.get({})
  if (accountInfo == null) {
    // If there is no account information in local storage let send a request
    // to Smuggler to make sure Archaeologist is logged in as a last resort.
    try {
      accountInfo = await authentication.getAuth({})
    } catch (err) {
      log.debug('Failed to fetch user account information from Smuggler, assume that user is not logged in yet', err)
    }
  }
  if (accountInfo != null) {
    const userAccount = new UserAccount(
      accountInfo.uid,
      accountInfo.name,
      accountInfo.email,
      {}
    )
    _loginHandler(userAccount)
  }
  log.debug('Authorisation module is registered', timer.elapsedSecondsPretty())
  return async () => {
    try {
      await _logoutHandler()
    } finally {
      _listeners.clear()
    }
  }
}
