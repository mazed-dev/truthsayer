import * as badge from './../badge/badge'
import {
  AccountInfo,
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
  // const account = new UserAccount(user.uid, user.name, user.email, {})

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

export async function check(): Promise<AccountInfo | null> {
  const accountInfo = await authentication.getAuth({}).catch(() => null)
  if (accountInfo != null) {
    await _loginHandler(accountInfo)
    return accountInfo
  } else {
    log.debug('auth.check -> null')
    await _logoutHandler()
    return null
  }
}

export async function login(args: SessionCreateArgs): Promise<AccountInfo> {
  await authentication.session.create(args)
  const user = await check()
  if (user == null) {
    throw new Error('Authorisation failed')
  }
  return user
}

async function getUserAccount(
  storage: StorageApi
  // accountInfo?: AccountInfo
): Promise<UserAccount | null> {
  // if (accountInfo != null) {
  //   // If account is known by the init time, preserve it in local storage
  //   await storage.account.info.set({
  //     accountInfo,
  //   })
  // } else {
  // Check the local storage for cached userAccount first
  let accountInfo = await storage.account.info.get({})
  if (accountInfo == null) {
    // If there is no account information in local storage let send a request
    // to smuggler to make sure Archaeologist is logged in as a last resort.
    try {
      accountInfo = await authentication.getAuth({})
    } catch {
    }
    // if (accountInfo == null) {
    //   throw new Error('Background is not authorised, please log in')
    // }
    // await storage.account.info.set({ accountInfo })
  }
  if (accountInfo == null) {
    return null
  } else {
    const account = new UserAccount(
      accountInfo.uid,
      accountInfo.name,
      accountInfo.email,
      {}
    )
    return account
  }
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
  observe({
    onLogin: async (account: UserAccount) => {
      await storage.account.info.set({ accountInfo: {
        uid: account.getUid(),
        email: account.getEmail(),
        name: account.getName(),
      }})
    },
    onLogout: async () => {
      await storage.account.info.set({})
    },
  })
  const userAccount = await getUserAccount(storage)
  if (userAccount != null) {
    _loginHandler(userAccount)
  }
  log.debug('Authorisation module is registered', timer.elapsed())
  return async () => {
    try {
      await _logoutHandler()
    } finally {
      _listeners.clear()
    }
  }
}
