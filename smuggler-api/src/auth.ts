import Cookies from 'universal-cookie'

import { smuggler } from './api'

import { Optional } from './util/optional'

import lodash from 'lodash'

export const COOKIES_VEIL_KEY: string = 'x-magic-veil'

/**
 * Local encryption is not ready to use yet, in fact it is not
 * part of our MVP, mock it for now.
 */
export class LocalCrypto {}

export interface AccountInterface {
  isAuthenticated: () => boolean
  getUid: () => string
  getName: () => string
  getEmail: () => string
  getLocalCrypto: () => LocalCrypto
}

export class AnonymousAccount implements AccountInterface {
  isAuthenticated(): boolean {
    return false
  }

  getUid(): string {
    throw Error('User is not authenticated')
  }

  getName(): string {
    throw Error('User is not authenticated')
  }

  getEmail(): string {
    throw Error('User is not authenticated')
  }

  getLocalCrypto(): LocalCrypto {
    throw Error('User is not authenticated')
  }
}

export class UserAccount extends AnonymousAccount {
  _uid: string
  _name: string
  _email: string
  _lc: LocalCrypto

  constructor(uid: string, name: string, email: string, lc: LocalCrypto) {
    super()
    this._uid = uid
    this._name = name
    this._email = email
    this._lc = lc
  }

  static async create(signal: AbortSignal): Promise<AccountInterface> {
    const user = await smuggler.getAuth({ signal }).catch(() => {
      return null
    })
    if (!user) {
      return new AnonymousAccount()
    }
    // const lc = await LocalCrypto.initInstance(user.uid)
    const lc = new LocalCrypto()
    return new UserAccount(user.uid, user.name, user.email, lc)
  }

  getUid(): string {
    return this._uid
  }

  getName(): string {
    return this._name
  }

  getEmail(): string {
    return this._email
  }

  getLocalCrypto(): LocalCrypto {
    return this._lc
  }

  isAuthenticated(): boolean {
    return true
  }
}

export async function createUserAccount(
  abortSignal: AbortSignal
): Promise<AccountInterface> {
  if (!authCookie.check()) {
    return new AnonymousAccount()
  }
  return await UserAccount.create(abortSignal)
}

function checkRawValue(value: string | null) {
  return value === 'y'
}

function getAuthCookieDomain(): string {
  if (process.env.REACT_APP_SMUGGLER_API_URL) {
    const url = new URL(process.env.REACT_APP_SMUGGLER_API_URL)
    return url?.hostname
  } else if (window.location.hostname) {
    return window.location.hostname
  }
  return ''
}

export const authCookie = {
  check() {
    // Is it too slow?
    const cookies = new Cookies()
    return cookies.get(COOKIES_VEIL_KEY) === 'y'
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

export class Knocker {
  _scheduledId: Optional<number>
  _abortCallback?: () => void
  _abortController: AbortController
  _knockingPeriod: number

  constructor(knockingPeriod?: number, abortCallback?: () => void) {
    this._scheduledId = null
    this._abortCallback = abortCallback
    this._abortController = new AbortController()
    if (knockingPeriod) {
      this._knockingPeriod = knockingPeriod
    } else {
      // Randomly select something between 5min - 10min
      this._knockingPeriod = lodash.random(300000, 600000)
    }
  }

  start() {
    if (this._scheduledId) {
      clearTimeout(this._scheduledId)
    }
    this._scheduledId = lodash.delay(this._doKnocKnock, this._knockingPeriod)
  }

  abort() {
    const { _abortCallback, _abortController, _scheduledId } = this
    if (_scheduledId) {
      clearTimeout(_scheduledId)
    }
    _abortController.abort()
    if (_abortCallback) {
      _abortCallback()
    }
  }

  _doKnocKnock = () => {
    try {
      smuggler.session.update(this._abortController.signal).then(() => {
        this.start()
      })
    } catch (error) {
      this.abort()
      throw error
    }
  }
}
