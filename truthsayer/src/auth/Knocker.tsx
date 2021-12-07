import React from 'react'

import { Knocker as KnockerEngine, authCookie } from 'smuggler-api'

type KnockerProps = {}
type KnockerState = {}

export class Knocker extends React.Component<KnockerProps, KnockerState> {
  _knocker: KnockerEngine

  constructor(props: {}) {
    super(props)
    this._knocker = new KnockerEngine(374321, this.logout)
  }

  componentDidMount() {
    if (authCookie.check()) {
      this._knocker.start()
    }
  }

  componentWillUnmount() {
    this._knocker.abort()
  }

  logout = () => {
    authCookie.drop()
  }

  render() {
    return <></>
  }
}
