import React from 'react'

import { Button } from 'react-bootstrap'
import { PostHog } from 'posthog-js'

import { KnockerElement } from '../auth/Knocker'

import { jcss } from 'elementary'
import {
  createUserAccount,
  AccountInterface,
  makeDatacenterStorageApi,
  makeAlwaysThrowingStorageApi,
} from 'smuggler-api'
import type { StorageApi } from 'smuggler-api'

import styles from './global.module.css'
import { NotificationToast } from './Toaster'
import { errorise, log, productanalytics } from 'armoury'
import { useAsyncEffect } from 'use-async-effect'

type Toaster = {
  push: (item: React.ReactElement) => void
}

export type MzdGlobalContextProps = {
  account: null | AccountInterface
  toaster: Toaster
  storage: StorageApi
  analytics: PostHog | null
}

const NOOP_TOASTER_PUSH = (_item: React.ReactElement) => {
  // *dbg*/ console.log('Default push() function called: ', header, message)
}

export const MzdGlobalContext = React.createContext<MzdGlobalContextProps>({
  account: null,
  toaster: {
    push: NOOP_TOASTER_PUSH,
  },
  storage: makeAlwaysThrowingStorageApi(),
  analytics: null,
})

type MzdGlobalProps = {
  analytics: PostHog | null
}
type MzdGlobalState = {
  toaster: Toaster
  account: AccountInterface | null
  storage: StorageApi
  analytics: PostHog | null
}

const kAnonymousAnalyticsWarning =
  'future product analytics events will be attached to an anonymous identity'

export function MzdGlobal(props: React.PropsWithChildren<MzdGlobalProps>) {
  const [fetchAccountAbortController] = React.useState(new AbortController())

  const [toasts, setToasts] = React.useState<React.ReactElement[]>([])
  const pushToast = React.useCallback(
    (item: React.ReactElement) => {
      let copy: React.ReactElement[] = toasts.slice()
      const index = copy.findIndex(
        (existingItem: React.ReactElement) => existingItem.key === item.key
      )
      if (index !== -1) {
        copy[index] = item
      } else {
        copy.push(item)
      }
      setToasts(copy)
    },
    [toasts]
  )

  const [account, setAccount] = React.useState<AccountInterface | null>(null)
  const [state] = React.useState<Omit<MzdGlobalState, 'account'>>({
    toaster: { push: pushToast },
    analytics: props.analytics,
    storage: makeDatacenterStorageApi(),
  })

  useAsyncEffect(async () => {
    let acc: AccountInterface | null = null
    try {
      acc = await createUserAccount(fetchAccountAbortController.signal)
    } catch (err) {
      log.warning(
        `Faild to initialise user acc (error = ${errorise(
          err
        )}), ${kAnonymousAnalyticsWarning}`
      )
      return
    }

    setAccount(acc)

    if (state.analytics) {
      try {
        // TODO[snikitin@outlook.com] In cases when truthsayer is launched
        // the user is already logged in user identification should happen
        // immediately at the point of product analytics instance creation
        // (via 'PostHogConfig.bootstrap' field). Without that, opening
        // truthsayer produces a single anonymous '$pageview' event followed
        // immediately by an '$identify' event. This makes analytics data
        // more difficult to navigate and consumes extra quota.
        productanalytics.identifyUser({
          analytics: state.analytics,
          nodeEnv: process.env.NODE_ENV,
          userUid: acc.getUid(),
        })
      } catch (e) {
        log.warning(`${errorise(e).message}, ${kAnonymousAnalyticsWarning}`)
      }
    }

    return () => {
      if (state.analytics) {
        state.analytics.reset()
        log.debug(
          `Product analytics identity have been reset, ${kAnonymousAnalyticsWarning}`
        )
      }
    }
  }, [])

  return (
    <MzdGlobalContext.Provider value={{ ...state, account }}>
      <KnockerElement />
      <div
        aria-live="polite"
        aria-atomic="true"
        className={jcss(styles.toaster_container)}
      >
        <div className={jcss(styles.toaster_root)}>{toasts}</div>
      </div>
      {props.children}
    </MzdGlobalContext.Provider>
  )
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
