import React, { useContext } from 'react'

import { crc32 } from 'crc'

import { Toast, Button } from 'react-bootstrap'

import { createUserAccount, AccountInterface, Knocker } from '../auth/local'

import { jcss } from 'elementary'
import { debug } from '../util/log'
import { smuggler } from 'smuggler-api'

import styles from './global.module.css'

const kMzdToastDefaultDelay = 4943 // Just a random number close to 5 seconds

type MzdToastProps = {
  title: string
  message: string
  delay: number
}
type MzdToastState = {
  show: boolean
}

class MzdToast extends React.Component<MzdToastProps, MzdToastState> {
  static defaultProps: MzdToastProps = {
    title: '',
    message: '',
    delay: kMzdToastDefaultDelay,
  }

  constructor(props: MzdToastProps) {
    super(props)
    this.state = {
      show: true,
    }
  }

  hide = () => {
    this.setState({
      show: false,
    })
  }

  render() {
    const delay = this.props.delay || kMzdToastDefaultDelay
    return (
      <Toast onClose={this.hide} show={this.state.show} delay={delay} autohide>
        <Toast.Header>
          <strong className="mr-auto">{this.props.title}</strong>
        </Toast.Header>
        <Toast.Body>{this.props.message}</Toast.Body>
      </Toast>
    )
  }
}

type Toaster = {
  toasts: any[]
  push: ({ title, message }: { title: string; message: string }) => void
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
    push: ({ title, message }) => {
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
  pushToast: ({ message, title }: { message: string; title: string }) => void
  resetAuxToobar: (key: string, group: string) => void

  constructor(props: MzdGlobalProps) {
    super(props)
    this.pushToast = ({ message, title }) => {
      const uKey = `${crc32(message)}-${Math.random()}`
      this.setState((state) => {
        return {
          toaster: {
            toasts: state.toaster.toasts.concat([
              <MzdToast message={message} title={title} key={uKey} />,
            ]),
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
    createUserAccount(this.fetchAccountAbortController).then((account) => {
      this.setState({ account })
    })
  }

  render() {
    return (
      <MzdGlobalContext.Provider value={this.state}>
        <Knocker />
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

// Example
export class ExampleWithStaticConsumer extends React.Component {
  onClick = () => {
    const toaster = this.context.toaster
    toaster.push({
      title: 'Example',
      message: 'Toast message created from example class',
    })
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

function ExampleWithElementConsumer() {
  return (
    <MzdGlobalContext.Consumer>
      {(context) => (
        <Button
          onClick={() => {
            context.toaster.push({
              title: 'Example',
              message: 'Toast message created from example class',
            })
          }}
        >
          Make a toast
        </Button>
      )}
    </MzdGlobalContext.Consumer>
  )
}

export default MzdGlobalContext
