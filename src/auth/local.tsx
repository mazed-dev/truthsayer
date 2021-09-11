import Cookies from 'universal-cookie'
import React from 'react'

import { LocalCrypto } from '../crypto/local'
import { getAuth, smugler } from '../smugler/api'
import { debug } from '../util/log'

const _VEIL_KEY: string = 'x-magic-veil'

export class AnonymousAccount {
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

  static async aCreate(cancelToken): Promise<UserAccount> {
    if (!checkAuth()) {
      return new AnonymousAccount()
    }
    const user = await getAuth({ cancelToken }).then((res) => {
      if (res) {
        return res.data
      }
      return null
    })
    if (!user) {
      return new AnonymousAccount()
    }
    const lc = await LocalCrypto.initInstance(user.uid)
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

export function checkAuth() {
  // Is it too slow?
  const cookies = new Cookies()
  return cookies.get(_VEIL_KEY) === 'y'
}

export function dropAuth() {
  const cookies = new Cookies()
  cookies.remove(_VEIL_KEY)
}

export class Knocker extends React.Component {
  constructor(props) {
    super(props)
    this.knockCancelToken = smugler.makeCancelToken()
    this.state = {
      scheduledKnocKnockId: null,
    }
  }

  componentDidMount() {
    if (checkAuth()) {
      this.scheduleKnocKnock()
    }
  }

  componentWillUnmount() {
    this.knockCancelToken.cancel()
    // https://javascript.info/settimeout-setinterval
    clearTimeout(this.state.scheduledKnocKnockId)
  }

  scheduleKnocKnock = () => {
    this.cancelDelayedKnocKnock()
    const scheduledKnocKnockId = setTimeout(this.doKnocKnock, 600000)
    this.setState({
      scheduledKnocKnockId,
    })
  }

  cancelDelayedKnocKnock = () => {
    if (!this.state.scheduledKnocKnockId !== null) {
      clearTimeout(this.state.scheduledKnocKnockId)
    }
  }

  logout = () => {
    this.cancelDelayedKnocKnock()
    this.knockCancelToken.cancel()
    dropAuth()
    this.setState({
      scheduledKnocKnockId: null,
    })
  }

  doKnocKnock = () => {
    smugler.session
      .update({ cancelToken: this.knockCancelToken.token })
      .then((res) => {
        if (res) {
          this.scheduleKnocKnock()
        } else {
          this.logout()
        }
      })
      .catch((err) => {
        this.logout()
      })
  }

  render() {
    return <></>
  }
}
