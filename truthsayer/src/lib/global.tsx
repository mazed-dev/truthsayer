import React, { useContext } from 'react'

import { crc32 } from 'crc'

import { Toast, Button } from 'react-bootstrap'

import { createUserAccount, AccountInterface, Knocker } from '../auth/local'

import { jcss } from '../util/jcss'
import { debug } from '../util/log'
import { smuggler } from 'smuggler-api'

import styles from './global.module.css'

const kMzdToastDefaultDelay = 4943 // Just a random number close to 5 seconds

class MzdToast extends React.Component {
  constructor(props) {
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

MzdToast.defaultProps = {
  delay: kMzdToastDefaultDelay,
}

export type MzdGlobalContextProps = {
  account: null | AccountInterface
  topbar: {}
  toaster: {
    toasts: string[]
    push: ({ header, message }: { header: string; message: string }) => void
  }
}

export const MzdGlobalContext = React.createContext<MzdGlobalContextProps>({
  account: null,
  topbar: {},
  toaster: {
    toasts: [],
    push: ({ header, message }) => {
      // *dbg*/ console.log('Default push() function called: ', header, message)
    },
  },
})

export class MzdGlobal extends React.Component {
  constructor(props) {
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
          topbar.aux[key] = group
        } else {
          delete topbar.aux[key]
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
        aux: {},
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
