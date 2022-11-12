import React from 'react'

import { Button } from 'react-bootstrap'
import { PostHog } from 'posthog-js'

import { KnockerElement } from '../auth/Knocker'

import { jcss } from 'elementary'
import { createUserAccount, AccountInterface, UserAccount } from 'smuggler-api'

import styles from './global.module.css'
import { NotificationToast } from './Toaster'
import { errorise, log } from 'armoury'

type Toaster = {
  toasts: React.ReactElement[]
  push: (item: React.ReactElement) => void
}

type Topbar = {
  aux: Map<string, string>
  reset: (key: string, group: string) => void
}

export type MzdGlobalContextProps = {
  account: null | AccountInterface
  topbar: Topbar | {}
  toaster: Toaster
  analytics: PostHog | null
}

export const MzdGlobalContext = React.createContext<MzdGlobalContextProps>({
  account: null,
  topbar: {},
  toaster: {
    toasts: [],
    push: (_item: React.ReactElement) => {
      // *dbg*/ console.log('Default push() function called: ', header, message)
    },
  },
  analytics: null,
})

type MzdGlobalProps = {
  analytics: PostHog | null
}
type MzdGlobalState = {
  topbar: Topbar
  toaster: Toaster
  account: AccountInterface | null
  analytics: PostHog | null
}

const kAnonymousAnalyticsWarning =
  'future product analytics events will be attached to an anonymous identity'

export class MzdGlobal extends React.Component<MzdGlobalProps, MzdGlobalState> {
  fetchAccountAbortController: AbortController
  pushToast: (item: React.ReactElement) => void
  resetAuxToobar: (key: string, group: string) => void

  constructor(props: MzdGlobalProps) {
    super(props)
    this.pushToast = (item: React.ReactElement) => {
      this.setState((state) => {
        const index = state.toaster.toasts.findIndex(
          (existingItem: React.ReactElement) => existingItem.key === item.key
        )
        let toasts = state.toaster.toasts
        if (index !== -1) {
          toasts[index] = item
        } else {
          toasts.push(item)
        }
        return {
          toaster: {
            toasts,
            push: state.toaster.push,
          },
        }
      })
    }
    this.resetAuxToobar = (key, group) => {
      this.setState((state) => {
        const topbar = state.topbar
        // Reset certain section by key and preserve everything else
        if (group) {
          topbar.aux.set(key, group)
        } else {
          topbar.aux.delete(key)
        }
        return {
          topbar,
        }
      })
    }
    this.fetchAccountAbortController = new AbortController()

    this.state = {
      toaster: {
        toasts: [],
        push: this.pushToast,
      },
      topbar: {
        aux: new Map(),
        reset: this.resetAuxToobar,
      },
      account: null,
      analytics: props.analytics,
    }
  }

  componentDidMount() {
    createUserAccount(this.fetchAccountAbortController.signal)
      .then((account) => {
        this.setState({ account })

        if (account instanceof UserAccount) {
          this.state.analytics?.identify(account.getUid())
          log.debug(
            `Valid user account, future events will be identified as ${account.getUid()}`
          )
        } else {
          log.warning(`No valid user account, ${kAnonymousAnalyticsWarning}`)
        }
      })
      .catch((reason) => {
        log.warning(
          `Faild to initialise user account (error = ${errorise(
            reason
          )}), ${kAnonymousAnalyticsWarning}`
        )
      })
  }

  componentWillUnmount() {
    if (this.state.analytics) {
      this.state.analytics.reset()
      log.debug(
        `Product analytics identity have been reset, ${kAnonymousAnalyticsWarning}`
      )
    }
  }

  render() {
    return (
      <MzdGlobalContext.Provider value={this.state}>
        <KnockerElement />
        <div
          aria-live="polite"
          aria-atomic="true"
          className={jcss(styles.toaster_container)}
        >
          <div className={jcss(styles.toaster_root)}>
            {this.state.toaster.toasts}
          </div>
        </div>
        {this.props.children}
      </MzdGlobalContext.Provider>
    )
  }
}

// Examples
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class ExampleWithStaticConsumer extends React.Component {
  onClick = () => {
    const toaster = this.context.toaster
    toaster.push(
      <NotificationToast
        title={'Example'}
        message={'Toast message created from example class'}
        key={'some-unique-toast-key'}
      />
    )
  }

  render() {
    return (
      <Button variant="primary" onClick={this.onClick}>
        Make a toast
      </Button>
    )
  }
}

ExampleWithStaticConsumer.contextType = MzdGlobalContext

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ExampleWithElementConsumer() {
  return (
    <MzdGlobalContext.Consumer>
      {(context) => (
        <Button
          onClick={() => {
            context.toaster.push(
              <NotificationToast
                title={'Example'}
                message={'Toast message created from example class'}
                key={'some-unique-toast-key'}
              />
            )
          }}
        >
          Make a toast
        </Button>
      )}
    </MzdGlobalContext.Consumer>
  )
}

export default MzdGlobalContext
