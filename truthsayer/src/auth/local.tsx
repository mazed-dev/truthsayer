import Cookies from 'universal-cookie'
import React from 'react'

import {
  smuggler,
  COOKIES_VEIL_KEY,
  UserAccount,
  AnonymousAccount,
  AccountInterface,
} from 'smuggler-api'

import { Optional } from '../util/types'

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
  abortControler: AbortController
): Promise<AccountInterface> {
  if (!checkAuth()) {
    return new AnonymousAccount()
  }
  return await UserAccount.create(abortControler)
}

type KnockerProps = {}
type KnockerState = {
  scheduledKnocKnockId: Optional<NodeJS.Timeout>
}

export class Knocker extends React.Component<KnockerProps, KnockerState> {
  knockAbortController: AbortController

  constructor(props: KnockerProps) {
    super(props)
    this.knockAbortController = new AbortController()
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
    this.knockAbortController.abort()
    if (this.state.scheduledKnocKnockId) {
      // https://javascript.info/settimeout-setinterval
      clearTimeout(this.state.scheduledKnocKnockId)
    }
  }

  scheduleKnocKnock = () => {
    this.cancelDelayedKnocKnock()
    const scheduledKnocKnockId = setTimeout(this.doKnocKnock, 600000)
    this.setState({
      scheduledKnocKnockId,
    })
  }

  cancelDelayedKnocKnock = () => {
    if (this.state.scheduledKnocKnockId) {
      clearTimeout(this.state.scheduledKnocKnockId)
    }
  }

  logout = () => {
    this.cancelDelayedKnocKnock()
    this.knockAbortController.abort()
    dropAuth()
    this.setState({
      scheduledKnocKnockId: null,
    })
  }

  doKnocKnock = () => {
    smuggler.session
      .update({ signal: this.knockAbortController.signal })
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
