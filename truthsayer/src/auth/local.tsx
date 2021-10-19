import Cookies from 'universal-cookie'
import React from 'react'

import {
  smuggler,
  CancelToken,
  COOKIES_VEIL_KEY,
  UserAccount,
  AnonymousAccount,
  AccountInterface,
} from 'smuggler-api'

export type { AccountInterface }
export type { UserAccount }

export function checkAuth() {
  // Is it too slow?
  const cookies = new Cookies()
  return cookies.get(COOKIES_VEIL_KEY) === 'y'
}

export function dropAuth() {
  const cookies = new Cookies()
  cookies.remove(COOKIES_VEIL_KEY)
}

export async function createUserAccount(
  cancelToken: CancelToken
): Promise<AccountInterface> {
  if (!checkAuth()) {
    return new AnonymousAccount()
  }
  return await UserAccount.create(cancelToken)
}

export class Knocker extends React.Component {
  constructor(props) {
    super(props)
    this.knockCancelToken = smuggler.makeCancelToken()
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
    smuggler.session
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
