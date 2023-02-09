import React from 'react'

import { Button } from 'react-bootstrap'
import { PostHog } from 'posthog-js'

import { jcss } from 'elementary'
import {
  makeAlwaysThrowingStorageApi,
  makeDatacenterStorageApi,
  makeMsgProxyStorageApi,
  UserAccount,
} from 'smuggler-api'
import type {
  StorageApi,
  StorageApiMsgPayload,
  StorageApiMsgReturnValue,
  ForwardToRealImpl,
} from 'smuggler-api'

import styles from './global.module.css'
import { NotificationToast } from './Toaster'
import { errorise, log, productanalytics } from 'armoury'
import { useAsyncEffect } from 'use-async-effect'
import {
  FromTruthsayer,
  getAppSettings,
} from 'truthsayer-archaeologist-communication'
import type { AppSettings } from 'truthsayer-archaeologist-communication'
import { Loader } from './loader'

type Toaster = {
  push: (item: React.ReactElement) => void
}

function makeStorageApi(appSettings: AppSettings): StorageApi {
  switch (appSettings.storageType) {
    case 'datacenter':
      return makeDatacenterStorageApi()
    case 'browser_ext': {
      const forwardToArchaeologist: ForwardToRealImpl = async (
        payload: StorageApiMsgPayload
      ): Promise<StorageApiMsgReturnValue> => {
        const response = await FromTruthsayer.sendMessage({
          type: 'MSG_PROXY_STORAGE_ACCESS_REQUEST',
          payload,
        })
        return response.value
      }
      return makeMsgProxyStorageApi(forwardToArchaeologist)
    }
  }
}

export type MzdGlobalContextProps = {
  account: null | UserAccount
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
  account: UserAccount
}
type MzdGlobalState = {
  toaster: Toaster
  account: UserAccount | null
  storage: StorageApi
  analytics: PostHog | null
}

const kAnonymousAnalyticsWarning =
  'future product analytics events will be attached to an anonymous identity'

export function MzdGlobal(props: React.PropsWithChildren<MzdGlobalProps>) {
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

  const [storage, setStorage] = React.useState<StorageApi | null>(null)
  useAsyncEffect(async () => {
    const settings = await getAppSettings()
    setStorage(makeStorageApi(settings))
  }, [])

  const [state] = React.useState<Omit<MzdGlobalState, 'account' | 'storage'>>({
    toaster: { push: pushToast },
    analytics: props.analytics,
  })

  useAsyncEffect(async () => {
    if (state.analytics == null) {
      return
    }

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
        userUid: props.account.getUid(),
      })
    } catch (e) {
      log.warning(`${errorise(e).message}, ${kAnonymousAnalyticsWarning}`)
      throw e
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

  if (storage == null) {
    return <Loader size={'large'} />
  }

  return (
    <MzdGlobalContext.Provider
      value={{ ...state, account: props.account, storage }}
    >
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
