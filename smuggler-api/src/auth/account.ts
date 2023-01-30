import { authentication } from '../api_datacenter'
import { authCookie } from './cookie'
import { AccountInterface } from './account_interface'
import type { LocalCrypto } from './account_interface'

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

  static async create(signal?: AbortSignal): Promise<AccountInterface> {
    const user = await authentication.getAuth({ signal }).catch(() => {
      return null
    })
    if (!user) {
      return new AnonymousAccount()
    }
    // const lc = await LocalCrypto.initInstance(user.uid)
    const lc: LocalCrypto = {}
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

  isAuthenticated(): true {
    return true
  }
}

export async function createUserAccount(
  abortSignal?: AbortSignal
): Promise<AccountInterface> {
  if (!authCookie.veil.check()) {
    return new AnonymousAccount()
  }
  return UserAccount.create(abortSignal)
}
