import React from 'react'

import { Button } from 'react-bootstrap'

import { KnockerElement } from '../auth/Knocker'

import { jcss } from 'elementary'
import { createUserAccount, AccountInterface } from 'smuggler-api'

import styles from './global.module.css'
import { NotificationToast } from './Toaster'

type Toaster = {
  toasts: React.ReactNodeArray
  push: (item: React.ReactNode) => void
}

type Topbar = {
  aux: Map<string, string>
  reset: (key: string, group: string) => void
}

export type MzdGlobalContextProps = {
  account: null | AccountInterface
  topbar: Topbar | {}
  toaster: Toaster
}

export const MzdGlobalContext = React.createContext<MzdGlobalContextProps>({
  account: null,
  topbar: {},
  toaster: {
    toasts: [],
    push: (_item: React.ReactNode) => {
      // *dbg*/ console.log('Default push() function called: ', header, message)
    },
  },
})

type MzdGlobalProps = {}
type MzdGlobalState = {
  topbar: Topbar
  toaster: Toaster
  account: AccountInterface | null
}

export class MzdGlobal extends React.Component<MzdGlobalProps, MzdGlobalState> {
  fetchAccountAbortController: AbortController
  pushToast: (item: React.ReactNode) => void
  resetAuxToobar: (key: string, group: string) => void

  constructor(props: MzdGlobalProps) {
    super(props)
    this.pushToast = (item: React.ReactNode) => {
      this.setState((state) => {
        return {
          toaster: {
            toasts: state.toaster.toasts.concat(item),
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
    }
  }

  componentDidMount() {
    createUserAccount(this.fetchAccountAbortController.signal).then(
      (account) => {
        this.setState({ account })
      }
    )
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
